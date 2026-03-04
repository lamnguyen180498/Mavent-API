import { OnEvent } from '@nestjs/event-emitter';
import {
  Lesson,
  LessonDocument,
  LessonStatus,
} from '../../../schemas/lesson.schema';
import { ZoomService } from '../../../zoom/zoom.service';
import dayjs from 'dayjs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Course } from '../../../schemas/course.schema';

export class LessonListener {
  constructor(
    private zoomService: ZoomService,
    @InjectModel(Lesson.name) private lessonModel: Model<Lesson>,
    @InjectModel(Course.name) private courseModel: Model<Course>,
  ) {}

  @OnEvent('lesson.zoom-create')
  async createZoomMeeting(payload: { lesson: LessonDocument }) {
    const lesson = payload.lesson;
    const zoom = await this.zoomService.createMeeting({
      topic: lesson.title,
      type: 2,
      start_time: dayjs(lesson.material.zoom_start_time).toISOString(),
      duration: lesson.material.duration / 60 || 60, // duration in minutes, default to 60 if not set
      password: lesson.material.zoom_password,
      timezone: lesson.material.zoom_timezone || 'Asia/Ho_Chi_Minh',
    });

    // Update the lesson with Zoom meeting details
    await this.lessonModel.findByIdAndUpdate(lesson._id, {
      'material.zoom_meeting_id': zoom.id,
      'material.zoom_start_url': zoom.start_url,
      'material.zoom_join_url': zoom.join_url,
      'material.zoom_host_id': zoom.host_id,
    });
  }

  @OnEvent('total_lesson_chapter.update')
  async updateTotalLesson(payload: {
    course_id: Types.ObjectId;
    lesson?: LessonDocument;
  }) {
    const { course_id, lesson } = payload;

    const totalLessonInCourse = await this.lessonModel.countDocuments({
      course_id,
      status: { $ne: LessonStatus.Draft },
      parent_id: { $ne: null },
    });

    const totalChapterInCourse = await this.lessonModel.countDocuments({
      course_id,
      parent_id: null,
    });

    await this.courseModel.findByIdAndUpdate(course_id, {
      total_lesson: totalLessonInCourse,
      total_chapter: totalChapterInCourse,
    });

    if (lesson?.parent_id) {
      const totalLessonInChapter = await this.lessonModel.countDocuments({
        parent_id: lesson.parent_id,
        status: { $ne: LessonStatus.Draft },
      });
      await this.lessonModel.findByIdAndUpdate(lesson.parent_id, {
        total_lesson: totalLessonInChapter,
      });
    }
  }
}
