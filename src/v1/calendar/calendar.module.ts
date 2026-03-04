import { Module } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Course, CourseSchema } from '../../schemas/course.schema';
import { UserCourse, UserCourseSchema } from '../../schemas/user-course.schema';

@Module({
  controllers: [CalendarController],
  providers: [CalendarService],
  imports: [
    MongooseModule.forFeature([{ name: Course.name, schema: CourseSchema }]),
    MongooseModule.forFeature([
      { name: UserCourse.name, schema: UserCourseSchema },
    ]),
  ],
})
export class CalendarModule {}
