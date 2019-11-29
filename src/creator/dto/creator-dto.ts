import { CreatorObj } from './creator-obj';
import { ApiModelProperty } from '@nestjs/swagger';
import { HeaderDto } from './header-dto';

export class CreatorDto {
  @ApiModelProperty()
  url: string;

  @ApiModelProperty()
  runPageScripts: boolean = false;

  @ApiModelProperty({ type: [CreatorObj] })
  types: CreatorObj[];

  @ApiModelProperty({ type: [HeaderDto] })
  headers: HeaderDto[];
}
