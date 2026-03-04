import { Module } from '@nestjs/common';
import { QuizTestService } from './quiz-test.service';
import { QuizTestController } from './quiz-test.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../../schemas/user.schema';
import { QuizTest, QuizTestSchema } from '../../schemas/quiz-test.schema';
import { Quiz, QuizSchema } from '../../schemas/quiz.schema';
import { QuizResult, QuizResultSchema } from '../../schemas/quiz-result.schema';
import { AdminQuizTestController } from './admin/quiz-test.controller';
import { AdminQuizTestService } from './admin/quiz-test.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: QuizTest.name, schema: QuizTestSchema },
      { name: Quiz.name, schema: QuizSchema },
      { name: QuizResult.name, schema: QuizResultSchema },
    ]),
  ],
  controllers: [QuizTestController, AdminQuizTestController],
  providers: [QuizTestService, AdminQuizTestService],
})
export class QuizTestModule {}
