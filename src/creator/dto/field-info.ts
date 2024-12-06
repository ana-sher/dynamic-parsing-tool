import { ApiProperty } from '@nestjs/swagger';

export class FieldInfo {
  @ApiProperty()
  name: string;

  @ApiProperty()
  type: string;

  @ApiProperty({ default: '.class[attribute="value"] > .child-class' })
  path: string;

  @ApiProperty({ default: false })
  isArray: boolean;

  @ApiProperty({ default: 'textContent' })
  fieldInHtml: string = 'textContent';

  @ApiProperty({ default: false })
  isNodeAttribute: boolean = false;

  @ApiProperty({
    description: `Describe values acceptable with separator ;. It will search includes in string and then transforming array elements that were filtered`,
    default: 'value1;value2',
  })
  arrayFilter: string = '';
}
