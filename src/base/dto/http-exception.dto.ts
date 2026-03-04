import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';

export class HttpExceptionDto {
  @ApiProperty()
  statusCode: HttpStatus;

  @ApiProperty()
  message: string;
}
