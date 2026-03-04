import { Controller, Get, Param, Patch, Req } from '@nestjs/common';
import { LessonService } from './lesson.service';
import { ApiOperation, ApiParam } from '@nestjs/swagger';
import { ParseObjectIdPipe } from 'src/pipes/parse-object-id.pipe';
import { Types } from 'mongoose';
import { UserDocument } from 'src/schemas/user.schema';

@Controller({ path: 'lessons', version: '1' })
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Chi tiết bài học',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Id lesson',
  })
  async getLesson(@Param('id', ParseObjectIdPipe) lesson_id: Types.ObjectId) {
    return await this.lessonService.getLesson(lesson_id);
  }

  @Patch(':id/user-complete')
  @ApiOperation({
    summary: 'Cập nhập trạng thái hoàn thành bài học của người dùng hiện tại',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Id lesson',
  })
  async userCompleteLesson(
    @Param('id', ParseObjectIdPipe) lesson_id: Types.ObjectId,
    @Req() req: { user: UserDocument },
  ) {
    return await this.lessonService.userCompleteLesson(lesson_id, req.user._id);
  }
}
