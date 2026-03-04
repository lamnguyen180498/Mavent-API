import { Module } from '@nestjs/common';
import { ResultService } from './result.service';
import { ResultController } from './result.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { QuizTest, QuizTestSchema } from '../../schemas/quiz-test.schema';
import { Quiz, QuizSchema } from '../../schemas/quiz.schema';
import { QuizResult, QuizResultSchema } from '../../schemas/quiz-result.schema';
import { Lesson, LessonSchema } from '../../schemas/lesson.schema';
import { Course, CourseSchema } from '../../schemas/course.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: QuizTest.name, schema: QuizTestSchema },
      { name: Quiz.name, schema: QuizSchema },
      { name: QuizResult.name, schema: QuizResultSchema },
      { name: Lesson.name, schema: LessonSchema },
      { name: Course.name, schema: CourseSchema },
    ]),
  ],
  controllers: [ResultController],
  providers: [ResultService],
})
export class ResultModule {}
