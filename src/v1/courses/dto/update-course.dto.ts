import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Course } from '../../../schemas/course.schema';

export class UpdateCourseDto extends PartialType(Course) {
  @IsOptional()
  @IsString()
  action_thumbnail?: 'delete' | 'upload';
}
