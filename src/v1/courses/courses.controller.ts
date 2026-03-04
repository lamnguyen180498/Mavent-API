import { Controller, Get, Logger, Param, Query, Req } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { Course, CourseStatusEnum } from '../../schemas/course.schema';
import { UserDocument } from '../../schemas/user.schema';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Connection, Types } from 'mongoose';
import { FindAllCourseDto } from './dto/find-all-course.dto';
import { PageDto } from '../../base/dto/page.dto';
import { Guest } from '../../decorators/auth.decorator';
import { CourseResponseDto } from './dto/course-response.dto';
import { InjectConnection } from '@nestjs/mongoose';
import { ParseObjectIdPipe } from 'src/pipes/parse-object-id.pipe';
import { FindUpcomomgCourseDto } from './dto/find_upcoming_course.dto';
import { getLearingProgressDto } from './dto/get-learning-progress.dto';
import { FilterStudentDto } from '../students/dto/filter-student.dto';
import { UserCourse } from 'src/schemas/user-course.schema';

@ApiTags('Khóa học')
@Controller({
  version: '1',
  path: 'courses',
})
export class CoursesController {
  logger = new Logger(CoursesController.name);

  constructor(
    private readonly coursesService: CoursesService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  @Get()
  @Guest()
  @ApiOperation({
    summary: 'Danh sách khóa học',
  })
  @ApiOkResponse({ type: PageDto<Course> || [Course] })
  findAll(
    @Query() query: FindAllCourseDto,
    @Req() req: { user?: UserDocument },
  ) {
    return this.coursesService.getCourses(query, req.user);
  }

  @Get('upcoming')
  @Guest()
  @ApiOperation({ summary: 'Danh sách lịch học sắp diễn ra' })
  async getUpcomingCourses(
    @Query() query: FindUpcomomgCourseDto,
    @Req() req: { user?: UserDocument },
  ) {
    return this.coursesService.getUpcomingCourses(query, req?.user?._id);
  }

  @Get('list')
  @Guest()
  @ApiOperation({
    summary: 'Danh sách khóa học trong select',
  })
  @ApiOkResponse({ type: PageDto<Course> || [Course] })
  listAll() {
    return this.coursesService.getCourses({
      all: true,
      skip: 0,
    });
  }

  @Get('learning-progress')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tiến độ học tập của user trong khóa học(s)' })
  async getSuccessLessonCount(
    @Query() query: getLearingProgressDto,
    @Req() req: { user: UserDocument },
  ) {
    return await this.coursesService.getSuccessLessonCount(query, req.user);
  }

  @Get(':identifier')
  @Guest()
  @ApiOperation({ summary: 'Chi tiết khóa học' })
  @ApiParam({
    name: 'identifier',
    type: 'string',
    description: 'ID hoặc Slug của khóa học',
  })
  @ApiOkResponse({ type: CourseResponseDto })
  async findOne(
    @Param('identifier') identifier: string,
    @Req() req: { user?: UserDocument },
  ) {
    return this.coursesService.getCourse(identifier, req.user);
  }

  @Get(':id/lessons')
  @Guest()
  @ApiOperation({ summary: 'Danh sách bài học' })
  async getCourseLessons(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.coursesService.getCourseLessons(id);
  }

  @Get(':id/user-lessons')
  @Guest()
  @ApiOperation({ summary: 'Danh sách bài học của user trong khóa học' })
  async getCourseLessonsUser(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Req() req: { user?: UserDocument },
  ) {
    return this.coursesService.getCourseLessons(id, req?.user);
  }

  @Get(':id/students')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Danh sách học viên đã mua khóa học' })
  async getStudents(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Query() query: FilterStudentDto,
  ) {
    return await this.coursesService.getStudents(id, query);
  }

  @Get(':id/enrolled')
  @ApiBearerAuth()
  @ApiOperation({ summary: '' })
  async getEnrolledStudents(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Req() req: { user: UserDocument },
  ) {
    const result = await this.coursesService.findOrCreate(UserCourse.name, {
      user_id: req.user._id,
      course_id: id,
    },{ user_id: req.user._id,
      course_id: id});
    return result.doc
  }

  @Guest()
  @Get(':id/zoom-signature')
  @ApiBearerAuth()
  @ApiOkResponse({
    schema: {
      example: {
        signature: 'string',
        zak: 'string',
      },
    },
  })
  async getZoomSignature(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Req() req: { user: UserDocument },
  ) {
    return this.coursesService.getZoomSignature(id, req.user);
  }
}
