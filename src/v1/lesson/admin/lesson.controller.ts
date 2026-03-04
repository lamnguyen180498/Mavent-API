import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { LessonService } from '../lesson.service';
import { ParseObjectIdPipe } from '../../../pipes/parse-object-id.pipe';
import { Types } from 'mongoose';
import {
  Lesson,
  LessonDocument,
  LessonMaterialType,
} from '../../../schemas/lesson.schema';
import { UpdateLessonDto } from '../dto/update-lesson.dto';
import { CreateLessonDto } from '../dto/create-lesson.dto';
import { UserDocument } from '../../../schemas/user.schema';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CoursesService } from 'src/v1/courses/courses.service';

@ApiBearerAuth()
@Controller({ path: 'admin/lessons', version: '1' })
export class AdminLessonController {
  constructor(
    private readonly lessonService: LessonService,
    private readonly coursesService: CoursesService,
    private eventEmitter: EventEmitter2,
  ) {}

  @Get('validate-video-lesson')
  async validateVideoLesson(@Query('url') url: string) {
    return await this.lessonService.validateLinkLessonVideo(url);
  }

  @Get(':id')
  async findLessonById(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.lessonService.findOneById(Lesson.name, id);
  }

  @Post()
  async createLesson(
    @Body() body: CreateLessonDto,
    @Req() req: { user?: UserDocument },
  ) {
    const newLesson = await this.lessonService.create<LessonDocument>(
      Lesson.name,
      {
        ...body,
        author_id: req.user._id,
      },
    );

    this.eventEmitter.emit('total_lesson_chapter.update', {
      course_id: body.course_id,
      lesson: newLesson,
    });

    if (
      newLesson.material?.type === LessonMaterialType.Stream &&
      !newLesson.material?.zoom_meeting_id
    )
      this.eventEmitter.emit('lesson.zoom-create', { lesson: newLesson });

    return newLesson;
  }

  @Patch(':id')
  async updateLessonById(
    @Param('id', ParseObjectIdPipe) _id: Types.ObjectId,
    @Body() updateLessonDto: UpdateLessonDto,
  ) {
    const lesson: Lesson = await this.lessonService.findOneById(
      Lesson.name,
      _id,
    );
    if (!lesson) {
      throw new NotFoundException('Không tồn tại bài học này');
    }
    const newLesson = await this.lessonService.update<LessonDocument>(
      Lesson.name,
      { _id },
      updateLessonDto,
      { new: true },
    );

    this.eventEmitter.emit('total_lesson_chapter.update', {
      course_id: newLesson.course_id,
      lesson: newLesson,
    });

    if (
      newLesson.material?.type === LessonMaterialType.Stream &&
      !newLesson.material?.zoom_meeting_id
    )
      this.eventEmitter.emit('lesson.zoom-create', { lesson: newLesson });

    return newLesson;
  }

  @Delete(':id')
  async deleteById(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.lessonService.deleteLesson(id);
  }
}
