import { Module } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { TeachersController } from './teachers.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Teacher, TeacherSchema } from 'src/schemas/teacher.schema';
import { User, UserSchema } from 'src/schemas/user.schema';
import { Course, CourseSchema } from 'src/schemas/course.schema';
import { AdminTeachersController } from './admin/teachers.controller';
import { AdminTeachersService } from './admin/teachers.service';
import { UserCourse, UserCourseSchema } from '../../schemas/user-course.schema';
import { OrderDetail, OrderDetailSchema } from '../../schemas/order-detail.schema';

@Module({
  controllers: [TeachersController, AdminTeachersController],
  providers: [TeachersService, AdminTeachersService],
  imports: [
    MongooseModule.forFeature([
      { name: Teacher.name, schema: TeacherSchema },
      { name: User.name, schema: UserSchema },
      { name: Course.name, schema: CourseSchema },
      { name: UserCourse.name, schema: UserCourseSchema },
      { name: OrderDetail.name, schema: OrderDetailSchema },
    ]),
  ],
})
export class TeachersModule { }
