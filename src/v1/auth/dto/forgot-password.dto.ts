import { IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ description: 'Email address', example: 'example@email.com' })
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase())
  email: string;
}
