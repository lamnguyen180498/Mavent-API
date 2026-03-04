import { OmitType } from '@nestjs/swagger';
import { Quiz } from '../../../schemas/quiz.schema';

export class CreateQuizDto extends OmitType(Quiz, [
  'creator_id',
  'updater_id',
] as const) {}
