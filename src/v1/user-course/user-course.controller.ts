import { Controller, Get, Query, Req } from '@nestjs/common';
import { UserCourseService } from './user-course.service';
import { ListOfStudentCourseDto } from './dto/list-of-student-course';
import { UserDocument } from '../../schemas/user.schema';
import { ListOfByTeacherDto } from './dto/list-of-teacher-course';

@Controller({ path: 'user-course', version: '1' })
export class UserCourseController {
  constructor(private readonly userCourseService: UserCourseService) {}

  @Get('')
  async listOfStudentCourse(
    @Query() query: ListOfStudentCourseDto,
    @Req() req: { user?: UserDocument },
  ) {
    return this.userCourseService.listOfStudentCourse(query, req.user);
  }

  @Get('by-teacher')
  async listOfCourseByTeacher(
    @Query() query: ListOfByTeacherDto,
    @Req() req: { user?: UserDocument },
  ) {
    return this.userCourseService.listOfCourseByTeacher(query, req.user);
  }
}
