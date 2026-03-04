import { Lesson } from '../../../schemas/lesson.schema';
import { PartialType } from '@nestjs/swagger';

export class CreateLessonDto extends PartialType(Lesson) {}
