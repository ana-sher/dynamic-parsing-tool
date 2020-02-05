import { Injectable, HttpService } from '@nestjs/common';
import { map } from 'rxjs/operators';
import { CreatorDto } from './dto/creator-dto';
import { JSDOM, Options } from 'jsdom';
import { CreatorObj } from './dto/creator-obj';
import { FieldInfo } from './dto/field-info';
import { TypesDict } from './dto/types-dict';
import { UserInputException } from './../shared/models/user-input-exception';
import { Observable, of } from 'rxjs';
import * as request from 'request-promise';

@Injectable()
export class ParsingService {
  private readonly domSettings: Options;
  private readonly basicTypes: string[];
  private readonly basicTypeConvertions: {
    [key: string]: (val: string) => any;
  };

  constructor(private readonly http: HttpService) {
    this.domSettings = {
      resources: 'usable',
    };
    this.basicTypes = ['string', 'number', 'boolean'];
    this.basicTypeConvertions = {
      string: val => val,
      number: val => Number(val),
      boolean: val => Boolean(val),
    };
  }

  parse(creatorDto: CreatorDto): Observable<any> {
    const config = {
      url: encodeURI(creatorDto.url),
      headers: creatorDto.headers?.reduce((prev, el) => {
        prev[el.key] = el.value;
        return prev;
      }, {}),
    };
    // (err, resp, body) => this.handleHttpResponse(body, creatorDto)
    let a = request(config)
    .then(resp => this.handleHttpResponse(resp, creatorDto));
    return of(a);
  }

  private getHost(url: string): string {
    return url
      .split('/')
      .splice(0, 3)
      .reduce((g, k) => g + '/' + k);
  }

  private handleHttpResponse(html: string, creatorDto: CreatorDto): any {
    let domSettings: Options = {};
    Object.assign(domSettings, this.domSettings);
    if (creatorDto.runPageScripts) {
      domSettings.runScripts = 'dangerously';
      html = html.replace(
        new RegExp(`src="/`, 'g'),
        `src="` + this.getHost(creatorDto.url) + '/',
      );
      html = html.replace(
        new RegExp(`src = "/`, 'g'),
        `src = "` + this.getHost(creatorDto.url) + '/',
      );
    }

    const {
      window: { document },
    } = new JSDOM(html, domSettings);

    const typesDict: TypesDict = this.normalizeArray(
      creatorDto.types,
      'typeName',
    );

    if (this.chechOnCircularDependencies(typesDict)) {
      throw new UserInputException(
        'You have circular dependencies in your types.',
      );
    }

    return this.parseType(creatorDto.types[0], document, typesDict);
  }

  private parseType(
    creatorObj: CreatorObj,
    document: Element | Document,
    typesDict: TypesDict,
  ): any {
    const resultObj = {};
    for (const field of creatorObj.objectFields) {
      resultObj[field.name] = Array.from(
        document.querySelectorAll(field.path),
      ).map(el => this.parseValue(field, el, typesDict));

      if (!field.isArray) {
        resultObj[field.name] = resultObj[field.name][0];
      }
    }
    return resultObj;
  }

  private parseValue(
    field: FieldInfo,
    value: any,
    typesDict: TypesDict,
  ): any {
    const type = field.type;
    const fieldInHtml = field.fieldInHtml || 'textContent';
    const valueFromHtml =
      (field.isNodeAttribute && value.attributes)
        ? value.getAttribute(field.fieldInHtml)
        : value[fieldInHtml];

    if (this.isBasicType(type)) {
      return this.basicTypeConvertions[type](valueFromHtml);
    }

    if (typesDict[type]) {
      return this.parseType(typesDict[type], value, typesDict);
    }

    return valueFromHtml;
  }

  private isBasicType(type: string): boolean {
    return this.basicTypes.includes(type);
  }

  private chechOnCircularDependencies(typesDict: TypesDict): boolean {
    for (const key in typesDict) {
      const way = [key];
      if (this.goToTheEndOfDependency(typesDict, way)) {
        return true;
      }
    }

    return false;
  }

  private goToTheEndOfDependency(typesDict: TypesDict, way: string[]): boolean {
    for (const field of typesDict[way[way.length - 1]].objectFields) {
      if (!this.isBasicType(field.type)) {
        if (way.includes(field.type)) {
          return true;
        }

        way.push(field.type);
        if (this.goToTheEndOfDependency(typesDict, way)) {
          return true;
        }
        way.pop();
      }
    }
    return false;
  }

  normalizeArray<T>(array: T[], indexKey: keyof T) {
    const normalizedObject: any = {};
    for (const el of array) {
      const key = el[indexKey];
      normalizedObject[key] = el;
    }
    return normalizedObject as { [key: string]: T };
  }
}
