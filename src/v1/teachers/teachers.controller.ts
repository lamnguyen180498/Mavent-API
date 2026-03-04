import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  Req,
  UploadedFiles,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { UserDocument } from '../../schemas/user.schema';
import { FindTeacherDto } from './dto/find-teacher.dto';
import { Types } from 'mongoose';
import { ParseObjectIdPipe } from '../../pipes/parse-object-id.pipe';
import { UpdateStatusTeacherDto } from './dto/update-status-teacher.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { FilterCourseTeacherDto } from './dto/filter-course-teacher.dto';
import { Roles } from 'src/decorators/roles.decorator';
import { ERole } from 'src/enums/role.enum';
import { RegistrationStatus, Teacher } from 'src/schemas/teacher.schema';
import { Guest } from '../../decorators/auth.decorator';

@ApiTags('Teacher')
@Controller({
  version: '1',
  path: 'teachers',
})
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) { }

  @Post()
  @ApiOperation({
    summary: 'Đăng ký giảng viên',
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'cic_card_front_image', maxCount: 1 },
      { name: 'cic_card_back_image', maxCount: 1 },
    ]),
  )
  async create(
    @Body() createTeacherDto: CreateTeacherDto,
    @Req() req: { user: UserDocument },
    @UploadedFiles()
    files: {
      cic_card_front_image?: Express.Multer.File[];
      cic_card_back_image?: Express.Multer.File[];
    },
  ) {
    if (!files?.cic_card_front_image?.[0] || !files?.cic_card_back_image?.[0]) {
      throw new BadRequestException(
        'Cần gửi đủ ảnh mặt trước và mặt sau của căn cước.',
      );
    }
    return this.teachersService.registerTeacher(
      createTeacherDto,
      files,
      req.user,
    );
  }

  @Get()
  @Guest()
  @ApiOperation({
    summary: 'Danh sách giảng viên',
  })
  async findAll(@Query() findTeacherDto: FindTeacherDto) {
    return this.teachersService.findAllTeacher(findTeacherDto);
  }

  @Get('me')
  @ApiBearerAuth()
  getInfo(@Req() req: { user: UserDocument }) {
    return this.teachersService.findOneByCondition(Teacher.name, {
      user_id: req.user._id,
      status: { $ne: RegistrationStatus.Rejected },
    });
  }

  @Get(':id')
  @Guest()
  @ApiOperation({
    summary: 'Hồ sơ giảng viên',
  })
  async getTeacherInfo(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return await this.teachersService.getTeacherInfo(id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Xóa hồ sơ giảng viên',
  })
  async remove(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.teachersService.remove(id);
  }

  @Patch('update-status/:id')
  @ApiOperation({
    summary: 'Cập nhật trạng thái (Duyệt giảng viên)',
  })
  async updateStatus(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() body: UpdateStatusTeacherDto,
  ) {
    return this.teachersService.updateStatus(id, body.status);
  }

  @Get(':id/courses')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Danh sách khóa học của giảng viên' })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'ID của giảng viên',
  })
  async getStudents(
    @Param('id', ParseObjectIdPipe) _id: Types.ObjectId,
    @Query() query: FilterCourseTeacherDto,
  ) {
    return await this.teachersService.getCourses(_id, query);
  }

  @Get('statistics/overview')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Thống kê tổng quan cho giảng viên' })
  async getStatistics(@Req() req: { user: UserDocument }, @Query() query: { from_date?: string; to_date?: string }) {
    // Assuming the teacher is linked to the user.
    // We need to find the teacher record associated with the user first.
    const teacher = await this.teachersService.findOneByCondition(Teacher.name, {
      user_id: req.user._id,
      status: { $ne: RegistrationStatus.Rejected },
    });

    if (!teacher) {
      throw new BadRequestException('Bạn chưa đăng ký làm giảng viên hoặc hồ sơ chưa được duyệt');
    }

    return await this.teachersService.getStatistics(req.user, query);
  }
}
