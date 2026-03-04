import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class FacebookMe {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  version = 'v20.0';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fields = 'id,name,email,first_name,last_name,birthday';
}

export class LoginSocialDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiPropertyOptional()
  @ValidateNested()
  @IsOptional()
  @Type(() => FacebookMe)
  facebook?: FacebookMe;
}
