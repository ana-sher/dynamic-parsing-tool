import { FieldInfo } from './field-info';
import { ApiModelProperty } from '@nestjs/swagger';

export class CreatorObj {
  @ApiModelProperty()
  typeName: string;

  @ApiModelProperty({ type: [FieldInfo] })
  objectFields: FieldInfo[];
}
