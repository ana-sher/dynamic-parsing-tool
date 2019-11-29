import { ApiModelProperty } from '@nestjs/swagger';

export class HeaderDto {
  @ApiModelProperty()
  key: string;

  @ApiModelProperty()
  value: string;
}
