import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { I18nContext } from 'nestjs-i18n';
import { Course, CourseSchema } from '../../schemas/course.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { UserCourse, UserCourseSchema } from 'src/schemas/user-course.schema';
import { AdminCoursesController } from './admin/courses.controller';
import { AdminCoursesService } from './admin/courses.service';
import { Lesson, LessonSchema } from '../../schemas/lesson.schema';
import {
  UpcomingCourses,
  UpcomingCoursesSchema,
} from 'src/schemas/upcoming_courses.schema';
import {
  MapCompleteLesson,
  MapCompleteLessonSchema,
} from 'src/schemas/map-complete-lesson.schema';
import {
  OrderDetail,
  OrderDetailSchema,
} from 'src/schemas/order-detail.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Course.name, schema: CourseSchema },
      { name: OrderDetail.name, schema: OrderDetailSchema },
      { name: User.name, schema: UserSchema },
      { name: UserCourse.name, schema: UserCourseSchema },
      { name: Lesson.name, schema: LessonSchema },
      { name: MapCompleteLesson.name, schema: MapCompleteLessonSchema },
      { name: UpcomingCourses.name, schema: UpcomingCoursesSchema },
    ]),
  ],
  controllers: [CoursesController, AdminCoursesController],
  providers: [CoursesService, AdminCoursesService, I18nContext],
  exports: [CoursesService, AdminCoursesService],
})
export class CoursesModule {}
