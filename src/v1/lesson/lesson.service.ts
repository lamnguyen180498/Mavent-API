import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { BaseService } from '../../base/base.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Lesson, LessonStatus } from '../../schemas/lesson.schema';
import Youtube from 'src/helper/youtube';
import Vimeo from 'src/helper/vimeo';
import {
  ECompleteLessonStatus,
  MapCompleteLesson,
} from 'src/schemas/map-complete-lesson.schema';
import { Course } from 'src/schemas/course.schema';
import { EventEmitter2 } from "@nestjs/event-emitter";

@Injectable()
export class LessonService extends BaseService {
  logger = new Logger(LessonService.name);
  constructor(
    @InjectModel(Lesson.name)
    private readonly lessonModel: Model<Lesson>,
    @InjectModel(MapCompleteLesson.name)
    private readonly mapCompleteLessonModel: Model<MapCompleteLesson>,
    @InjectModel(Course.name)
    private readonly courseModel: Model<Course>,
    private eventEmitter: EventEmitter2,
  ) {
    super({ [Lesson.name]: lessonModel });
  }

  async deleteLesson(id: Types.ObjectId) {
    const lesson = await this.lessonModel.findById(id);
    if (!lesson) {
      throw new NotFoundException(`Bài học không tồn tại.`);
    }

    // Nếu lesson không phải là bài học gốc (k có parent_id), xóa các bài học con
    if (!lesson.parent_id) {
      await this.lessonModel.deleteMany({ parent_id: lesson._id });
    }
    await lesson.deleteOne();

    this.eventEmitter.emit('total_lesson_chapter.update', {
      course_id: lesson.course_id,
      lesson,
    });
    return;
  }

  async validateLinkLessonVideo(url: string) {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    const result = {
      title: '',
      video_id: null,
      ext: '',
      duration: null,
      thumbnail_url: null,
    };
    if (hostname === 'youtube.com' || hostname === 'youtu.be') {
      const youtube = new Youtube();
      result.video_id = youtube.getVideoIdFromUrl(url);
      const videoInfo = await youtube.getVideoInfo(
        process.env.KEY_YOUTUBE,
        result.video_id,
      );
      if (!videoInfo) {
        throw new NotFoundException(`Thông tin video không tồn tại`);
      }
      result.duration = videoInfo.contentDetails?.duration
        ? youtube.handleDuration(videoInfo.contentDetails?.duration)
        : null;
      result.ext = 'youtube';
      result.title = videoInfo.snippet.title;
      result.thumbnail_url = videoInfo.snippet.thumbnails.default.url;
    } else if (hostname === 'vimeo.com' || hostname === 'player.vimeo.com') {
      const vimeo = new Vimeo();
      const videoInfo = await vimeo.getInfo(url);
      if (!videoInfo) {
        throw new NotFoundException(`Thông tin video không tồn tại`);
      }
      result.video_id = videoInfo?.video_id ?? null;
      result.title = videoInfo.title;
      result.duration = videoInfo.duration;
      result.ext = 'vimeo';
      result.thumbnail_url = videoInfo.thumbnail_url;
    } else {
      throw new BadRequestException(
        `Bài học video chỉ hỗ trợ youtube và vimeo`,
      );
    }

    if (!result.video_id) {
      throw new NotFoundException(`Không tìm thấy video ID trong URL`);
    }

    return result;
  }

  async getLesson(lessonId: Types.ObjectId) {
    return await this.lessonModel.findOne({
      _id: lessonId,
      status: LessonStatus.Published,
    });
  }

  async userCompleteLesson(lessonId: Types.ObjectId, user_id: Types.ObjectId) {
    try {
      const lesson = await this.lessonModel.findById(lessonId);
      return this.mapCompleteLessonModel.findOneAndUpdate(
        {
          user_id,
          lesson_id: lessonId,
          course_id: lesson.course_id,
        },
        { status: ECompleteLessonStatus.Finished },
        { upsert: true, new: true },
      );
    } catch (e) {
      this.logger.error(e);
      return false;
    }
  }
}
