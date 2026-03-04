import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsOptional, IsString } from 'class-validator';

export class AssignCourseDto {
  @ApiProperty({ type: Array, description: 'Danh sách Khóa học cần gắn' })
  @IsArray()
  @ArrayNotEmpty()
  course_ids: any[];

  @ApiProperty({ type: String, description: 'Nguồn' })
  @IsOptional()
  @IsString()
  src: string;
}
