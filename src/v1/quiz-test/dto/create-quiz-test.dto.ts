import { OmitType } from '@nestjs/swagger';
import { QuizTest } from 'src/schemas/quiz-test.schema';

export class CreateQuizTestDto extends OmitType(QuizTest, [
  'creator_id',
  'code',
  'deleted_at',
  'updater_id',
] as const) {}
