import { ApiProperty } from '@nestjs/swagger';

export class GetAllCourseResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  name: string;
}
