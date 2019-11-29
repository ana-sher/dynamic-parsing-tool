import {
  Controller,
  Post,
  BadRequestException,
  UnprocessableEntityException,
  InternalServerErrorException,
  Body,
} from '@nestjs/common';
import { ParsingService } from './parsing.service';
import { CreatorDto } from './dto/creator-dto';
import { CreatorObj } from './dto/creator-obj';
import { UserInputException } from './../shared/models/user-input-exception';
import { Observable } from 'rxjs';

@Controller('creator')
export class CreatorController {
  constructor(private readonly parsingService: ParsingService) {}
  @Post()
  parse(@Body() creatorDto: CreatorDto): Observable<any> {
    if (!creatorDto.url) {
      throw new BadRequestException(`Can't parse object without url.`);
    }

    try {
      return this.parsingService.parse(creatorDto);
    } catch (error) {
      if (error instanceof UserInputException) {
        throw new BadRequestException(error.message);
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
  }
}
