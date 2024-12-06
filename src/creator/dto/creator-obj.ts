import { FieldInfo } from './field-info';
import { ApiProperty } from '@nestjs/swagger';

export class CreatorObj {
  @ApiProperty({ default: 'Root' })
  typeName: string;

  @ApiProperty({ type: [FieldInfo] })
  objectFields: FieldInfo[];
}
