import { Module } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Quiz, QuizSchema } from '../../schemas/quiz.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { QuizListener } from './listeners/quiz.listener';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Quiz.name, schema: QuizSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [QuizController],
  providers: [QuizService,QuizListener],
})
export class QuizModule {}
