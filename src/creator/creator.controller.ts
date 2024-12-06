import {
  Controller,
  Post,
  BadRequestException,
  InternalServerErrorException,
  Body,
} from '@nestjs/common';
import { ParsingService } from './parsing.service';
import { CreatorDto } from './dto/creator-dto';
import { UserInputException } from './../shared/models/user-input-exception';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('creator')
@Controller('creator')
export class CreatorController {
  constructor(private readonly parsingService: ParsingService) {}
  @Post()
  @ApiResponse({
    status: 201,
    description: 'The type was successfully parsed.',
  })
  @ApiResponse({ status: 403, description: 'Access to link is forbidden.' })
  async parse(@Body() creatorDto: CreatorDto) {
    if (!creatorDto.url) {
      throw new BadRequestException(`Can't parse object without url.`);
    }

    try {
      return await this.parsingService.parse(creatorDto);
    } catch (error) {
      if (error instanceof UserInputException) {
        throw new BadRequestException(error.message);
      } else {
        throw new InternalServerErrorException(error.message);
      }
    }
  }
}
