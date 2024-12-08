import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CreatorDto } from './dto/creator-dto';
import { JSDOM, BaseOptions } from 'jsdom';
import { CreatorObj } from './dto/creator-obj';
import { FieldInfo } from './dto/field-info';
import { TypesDict } from './dto/types-dict';
import { UserInputException } from './../shared/models/user-input-exception';
import puppeteer from 'puppeteer-extra';
import chromium = require('@sparticuz/chromium');
import puppeteerCore from 'puppeteer-core';
import StealthPlugin = require('puppeteer-extra-plugin-stealth');

@Injectable()
export class ParsingService {
  private readonly domSettings: BaseOptions;
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
      string: (val) => val,
      number: (val) => Number(val.replace(',', '.').replace(/[^0-9\.]+/g, '')),
      boolean: (val) => Boolean(val),
    };
  }

  async parse(creatorDto: CreatorDto) {
    const config = {
      // url: encodeURI(creatorDto.url),
      headers: creatorDto.headers?.reduce((prev, el) => {
        prev[el.key] = el.value;
        return prev;
      }, {}),
    };
    puppeteer.use(StealthPlugin());
    const lang = config.headers['accept-language'] ?? 'en-US,en';
    let browser;
    if (process.env.NODE_ENV == 'development') {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--lang=' + lang, '--accept-lang=' + lang],
        timeout: 10000,
      });
    } else {
      browser = await puppeteerCore.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });
    }
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    const userAgent =
      config.headers['user-agent'] ??
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';
    await page.setUserAgent(userAgent);
    await page.setExtraHTTPHeaders(config.headers);
    await page.setViewport({
      width: 1920 + Math.floor(Math.random() * 100),
      height: 3000 + Math.floor(Math.random() * 100),
      deviceScaleFactor: 1,
      hasTouch: false,
      isLandscape: false,
      isMobile: false,
    });
    await page.setJavaScriptEnabled(true);
    await page.setDefaultNavigationTimeout(0);

    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (
        req.resourceType() == 'stylesheet' ||
        req.resourceType() == 'font' ||
        req.resourceType() == 'image'
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
    });

    await page.evaluateOnNewDocument(() => {
      window['chrome'] = {
        runtime: {},
      };
    });

    await page.evaluateOnNewDocument(() => {
      const originalQuery = window.navigator.permissions.query;
      return (window.navigator.permissions.query = (parameters) =>
        parameters.name === 'notifications'
          ? Promise.resolve({
              state: Notification.permission,
            } as PermissionStatus)
          : originalQuery(parameters));
    });

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
    });

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });
      Object.defineProperty(navigator, 'language', {
        get: function () {
          return lang;
        },
      });
    });
    try {
      await page.goto(creatorDto.url, {
        waitUntil: 'networkidle2',
        timeout: 0,
      });
      const data = await page.content();
      // .evaluate(
      //   () => document.querySelector('*').outerHTML,
      // );
      await browser.close();
      return this.handleHttpResponse(data, creatorDto);
    } catch (error) {
      console.error('Error while scraping url:', error);
      await browser.close();
    }
  }

  private getHost(url: string): string {
    return url
      .split('/')
      .splice(0, 3)
      .reduce((g, k) => g + '/' + k);
  }

  private handleHttpResponse(html: string, creatorDto: CreatorDto): any {
    let domSettings: BaseOptions = {};
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

    if (this.checkOnCircularDependencies(typesDict)) {
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
      const needsFiltering = field.isArray && field.arrayFilter?.length > 0;
      resultObj[field.name] = Array.from(document.querySelectorAll(field.path))
        .filter((el) => {
          if (needsFiltering) {
            const valuesToInclude = field.arrayFilter.split(';');
            return valuesToInclude.some((v) =>
              this.parseValue(
                { ...field, type: 'string' },
                el,
                typesDict,
              ).includes(v),
            );
          }
          return true;
        })
        .map((el) => this.parseValue(field, el, typesDict));

      if (!field.isArray && resultObj[field.name]?.length > 0) {
        resultObj[field.name] = resultObj[field.name][0];
      }
      if (!field.isArray && resultObj[field.name]?.length == 0) {
        delete resultObj[field.name];
      }
    }
    return resultObj;
  }

  private parseValue(field: FieldInfo, value: any, typesDict: TypesDict): any {
    const type = field.type;
    const fieldInHtml = field.fieldInHtml || 'textContent';
    const valueFromHtml =
      field.isNodeAttribute && value.attributes
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

  private checkOnCircularDependencies(typesDict: TypesDict): boolean {
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
