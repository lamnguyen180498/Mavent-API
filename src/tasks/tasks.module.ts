import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TasksService } from './tasks.service';
import { Course, CourseSchema } from '../schemas/course.schema';
import {
  EmailRemindersSent,
  EmailRemindersSentSchema,
} from '../schemas/email_reminders_sent.schema';
import {
  UpcomingCourses,
  UpcomingCoursesSchema,
} from 'src/schemas/upcoming_courses.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Course.name, schema: CourseSchema },
      { name: EmailRemindersSent.name, schema: EmailRemindersSentSchema },
      { name: UpcomingCourses.name, schema: UpcomingCoursesSchema },
    ]),
  ],
  providers: [TasksService],
})
export class TasksModule {}
