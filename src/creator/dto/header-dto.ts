import { ApiProperty } from '@nestjs/swagger';

export class HeaderDto {
  @ApiProperty()
  key: string;

  @ApiProperty()
  value: string;
}
