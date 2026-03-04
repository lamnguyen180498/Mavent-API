import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Connection, Model, Types } from 'mongoose';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { CreateCourseDto } from '../dto/create-course.dto';
import { User, UserDocument } from '../../../schemas/user.schema';
import { PageDto } from '../../../base/dto/page.dto';
import { Course } from '../../../schemas/course.schema';
import { FindAllCourseDto } from '../dto/find-all-course.dto';
import { AdminCoursesService } from './courses.service';
import { ParseObjectIdPipe } from '../../../pipes/parse-object-id.pipe';
import { UpdateCourseDto } from '../dto/update-course.dto';
import { FindLessonByCourseDto } from '../dto/find-lesson-by-course.dto';
import { Lesson } from '../../../schemas/lesson.schema';
import { SaveChapterOrLessonDto } from '../dto/save-chapter-or-lesson.dto';
import { omit } from 'lodash';
import { UserCourse } from '../../../schemas/user-course.schema';

@ApiTags('Khóa học')
@ApiBearerAuth()
@Controller({
  version: '1',
  path: 'admin/courses',
})
export class AdminCoursesController {
  logger = new Logger(AdminCoursesController.name);

  constructor(
    private readonly adminCoursesService: AdminCoursesService,
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(UserCourse.name)
    private readonly userCourseModel: Model<UserCourse>,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Tạo khóa học' })
  @UseInterceptors(AnyFilesInterceptor())
  create(
    @Body() createCourseDto: CreateCourseDto,
    @Req() req: { user: UserDocument },
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.adminCoursesService.createCourse(
      createCourseDto,
      req.user,
      files,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Sửa khóa học' })
  @UseInterceptors(AnyFilesInterceptor())
  edit(
    @Param('id', ParseObjectIdPipe) _id: Types.ObjectId,
    @Body() updateCourseDto: UpdateCourseDto,
    @Req() req: { user: UserDocument },
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.adminCoursesService.editCourse(
      _id,
      updateCourseDto,
      req.user,
      files,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Danh sách khóa học',
  })
  @ApiOkResponse({ type: PageDto<Course> })
  findAll(
    @Query() query: FindAllCourseDto,
    @Req() req: { user?: UserDocument },
  ) {
    return this.adminCoursesService.getCourses(query, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa khóa học' })
  @ApiParam({
    name: 'id',
    type: 'string',
  })
  async remove(
    @Param('id', ParseObjectIdPipe) _id: Types.ObjectId,
    @Req() req: { user?: UserDocument },
  ) {
    const realUser = new this.userModel(omit(req.user, 'is_admin'));

    const course = await this.adminCoursesService.findOneById<Course>(
      Course.name,
      _id,
    );

    if (!course) {
      throw new HttpException('Khóa học không tồn tại', 404);
    }

    if (!realUser.isAdministrator() && req.user._id.equals(course.owner_id)) {
      throw new HttpException('Bạn không có quyền xóa khóa học này', 403);
    }

    // Kiểm tra nếu khóa học có bất kỳ lớp học nào có học viên đã thanh toán
    const currentCohortCodes = (course.cohorts || [])
      .map((c) => c.code)
      .filter((code) => code !== undefined);
    if (currentCohortCodes.length > 0) {
      const paidCohortCodes =
        await this.adminCoursesService.getCohortsWithPaidStudents(
          course._id,
          currentCohortCodes,
        );
      if (paidCohortCodes.length > 0) {
        throw new HttpException(
          `Không thể xóa khóa học vì các lớp ${paidCohortCodes.join(', ')} đã có học viên thanh toán`,
          400,
        );
      }
    }

    await this.adminCoursesService.update<Course>(
      Course.name,
      { _id, owner_id: req.user._id },
      { deleted_at: new Date(), $unset: { slug: 1 } },
      { new: true },
    );
    await this.adminCoursesService.updateUpcomingCourse(course);
  }

  @Get(':id/lessons')
  @ApiOperation({
    summary: 'Danh sách bài học trong khóa học',
  })
  @ApiOkResponse({ type: PageDto<Lesson> })
  findLessonInCourse(
    @Param('id', ParseObjectIdPipe) _id: Types.ObjectId,
    @Query() query: FindLessonByCourseDto,
    @Req() req: { user?: UserDocument },
  ) {
    return this.adminCoursesService.findLessonsByCourse(_id, query, req.user);
  }

  @Post(':id')
  @ApiOperation({ summary: 'Lưu chương/bài trong khóa học' })
  saveChapterOrLesson(
    @Body() body: SaveChapterOrLessonDto[],
    @Param('id', ParseObjectIdPipe) _id: Types.ObjectId,
    @Req() req: { user?: UserDocument },
  ) {
    return this.adminCoursesService.saveChapterOrLesson(_id, body, req.user);
  }

  @Delete('user-courses/:id')
  @ApiOperation({ summary: 'Xóa khóa học khỏi danh sách khóa học của user' })
  @ApiParam({
    name: 'id',
    type: 'string',
  })
  async removeCourseFromUser(
    @Param('id', ParseObjectIdPipe) _id: Types.ObjectId,
    @Req() req: { user: UserDocument },
  ) {
    const userCourse = await this.userCourseModel
      .findById(_id)
      .populate('course');
    if (
      userCourse &&
      userCourse.course &&
      userCourse.course.owner_id.equals(req.user._id)
    ) {
      await this.userCourseModel.findByIdAndUpdate(_id, {
        deleted_at: new Date(),
      });
      return {
        message: 'Xóa khóa học khỏi danh sách khóa học của user thành công',
      };
    }
    throw new HttpException(
      'Không tìm thấy khóa học của user hoặc bạn không có quyền xóa',
      404,
    );
  }
}
