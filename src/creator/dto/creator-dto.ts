import { CreatorObj } from './creator-obj';
import { ApiProperty } from '@nestjs/swagger';
import { HeaderDto } from './header-dto';

export class CreatorDto {
  @ApiProperty()
  url: string;

  @ApiProperty({ default: false })
  runPageScripts: boolean = false;

  @ApiProperty({ type: [CreatorObj] })
  types: CreatorObj[];

  @ApiProperty({ type: [HeaderDto] })
  headers: HeaderDto[];
}
