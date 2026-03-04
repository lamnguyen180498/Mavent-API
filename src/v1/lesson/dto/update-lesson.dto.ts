import { Lesson } from '../../../schemas/lesson.schema';
import { PartialType } from '@nestjs/swagger';

export class UpdateLessonDto extends PartialType(Lesson) {}
