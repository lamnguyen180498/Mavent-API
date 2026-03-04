import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserDocument } from 'src/schemas/user.schema';
import { FilterStudentDto } from './dto/filter-student.dto';
import { Connection } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { AssignCourseDto } from './dto/assign-course.dto';

@ApiTags('Học viên')
@Controller({
  path: 'students',
  version: '1',
})
export class StudentsController {
  constructor(
    private readonly studentsService: StudentsService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  @Get('me')
  @ApiBearerAuth()
  async myCourses(
    @Query() query: FilterStudentDto,
    @Req() req: { user: UserDocument },
  ) {
    return await this.studentsService.myCourses(req.user._id, query);
  }

  @Post('assign-course')
  @ApiBearerAuth()
  async assignCourse(
    @Body() body: AssignCourseDto,
    @Req() req: { user: UserDocument },
  ) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const result = await this.studentsService.mapCourses(
        req.user._id,
        body.course_ids,
        session,
      );
      await session.commitTransaction();
      return {
        statusCode: HttpStatus.OK,
        message: 'Gắn khóa học thành công',
        data: result,
      };
    } catch (e) {
      await session.abortTransaction();
      throw new HttpException(
        'Có lỗi xảy ra, vui lòng thử lại',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await session.endSession();
    }
  }
}
