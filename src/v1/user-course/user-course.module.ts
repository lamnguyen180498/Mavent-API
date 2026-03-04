import { Module } from '@nestjs/common';
import { UserCourseService } from './user-course.service';
import { UserCourseController } from './user-course.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserCourse, UserCourseSchema } from '../../schemas/user-course.schema';

@Module({
  controllers: [UserCourseController],
  providers: [UserCourseService],
  imports: [
    MongooseModule.forFeature([{ name:UserCourse.name, schema: UserCourseSchema }]),
  ],
})
export class UserCourseModule {}
