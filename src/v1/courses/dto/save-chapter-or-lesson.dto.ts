import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Lesson } from '../../../schemas/lesson.schema';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/swagger';

export class LessonDto extends PartialType(Lesson) {
  @IsOptional()
  _id?: string;
}

export class SaveChapterOrLessonDto extends LessonDto {
  @IsString()
  _id: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LessonDto)
  children?: LessonDto[];
}
