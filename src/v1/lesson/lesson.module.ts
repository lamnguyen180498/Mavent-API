import { forwardRef, Module } from '@nestjs/common';
import { LessonService } from './lesson.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Lesson, LessonSchema } from '../../schemas/lesson.schema';
import { LessonController } from './lesson.controller';
import { AdminLessonController } from './admin/lesson.controller';
import { LessonListener } from './listeners/lesson.listener';
import {
  MapCompleteLesson,
  MapCompleteLessonSchema,
} from 'src/schemas/map-complete-lesson.schema';
import { CoursesModule } from '../courses/courses.module';
import { Course, CourseSchema } from 'src/schemas/course.schema';

@Module({
  controllers: [LessonController, AdminLessonController],
  imports: [
    MongooseModule.forFeature([
      { name: Lesson.name, schema: LessonSchema },
      { name: MapCompleteLesson.name, schema: MapCompleteLessonSchema },
      { name: Course.name, schema: CourseSchema },
    ]),
    forwardRef(() => CoursesModule),
  ],
  providers: [LessonService, LessonListener],
  exports: [LessonService],
})
export class LessonModule {}
