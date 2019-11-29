import { ApiModelProperty } from '@nestjs/swagger';

export class FieldInfo {
  @ApiModelProperty()
  name: string;

  @ApiModelProperty()
  type: string;

  @ApiModelProperty()
  path: string;

  @ApiModelProperty()
  isArray: boolean;

  @ApiModelProperty()
  fieldInHtml: string = 'textContent';

  @ApiModelProperty()
  isNodeAttribute: boolean = false;
}
