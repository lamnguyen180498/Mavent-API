import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TokenDto {
  @ApiProperty()
  access_token: string;

  @ApiPropertyOptional()
  refresh_token?: string;
}
