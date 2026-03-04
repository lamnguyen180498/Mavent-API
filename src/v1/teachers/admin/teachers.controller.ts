import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateTeacherDto } from '../dto/update-teacher.dto';
import { AdminTeachersService } from './teachers.service';
import { ParseObjectIdPipe } from 'src/pipes/parse-object-id.pipe';
import { Types } from 'mongoose';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

@ApiTags('Teacher')
@ApiBearerAuth()
@Controller({
  version: '1',
  path: 'admin/teachers',
})
export class AdminTeachersController {
  constructor(private readonly adminTeachersService: AdminTeachersService) {}

  @Patch(':id')
  @ApiOperation({
    summary: 'Cập nhật thông tin giảng viên',
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'avatar', maxCount: 1 },
      { name: 'cic_card_front_image', maxCount: 1 },
      { name: 'cic_card_back_image', maxCount: 1 },
    ]),
  )
  async update(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() body: UpdateTeacherDto,
    @UploadedFiles()
    files: {
      cic_card_front_image?: Express.Multer.File[];
      cic_card_back_image?: Express.Multer.File[];
      avatar?: Express.Multer.File[];
    },
  ) {
    return this.adminTeachersService.updateTeacher(id, body, files);
  }

  @Post('verify')
  async verifyTeachers(@Body('teacher_ids') ids: string[]) {
    return this.adminTeachersService.verifyTeachers(ids);
  }
}
