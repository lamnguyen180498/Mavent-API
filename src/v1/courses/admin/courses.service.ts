import { HttpException, Injectable, Logger } from '@nestjs/common';
import { FilterQuery, Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import slug from 'slug';
import {
  Course,
  CourseDocument,
  CourseStatusEnum,
} from '../../../schemas/course.schema';
import { BaseService } from '../../../base/base.service';
import { User, UserDocument } from '../../../schemas/user.schema';
import { CreateCourseDto } from '../dto/create-course.dto';
import {
  deleteFile,
  uploadFile,
  validateImageFile,
} from '../../../helper/common';
import { FindAllCourseDto } from '../dto/find-all-course.dto';
import { isUndefined, omit } from 'lodash';
import { UpdateCourseDto } from '../dto/update-course.dto';
import { FindLessonByCourseDto } from '../dto/find-lesson-by-course.dto';
import {
  Lesson,
  LessonDocument,
  LessonMaterialType,
} from '../../../schemas/lesson.schema';
import { SaveChapterOrLessonDto } from '../dto/save-chapter-or-lesson.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UpcomingCourses } from 'src/schemas/upcoming_courses.schema';
import dayjs from 'dayjs';
import { OrderDetail } from 'src/schemas/order-detail.schema';
import { EPaymentStatus } from 'src/schemas/order.schema';

@Injectable()
export class AdminCoursesService extends BaseService {
  logger = new Logger(AdminCoursesService.name);

  constructor(
    @InjectModel(Course.name) private readonly courseModel: Model<Course>,
    @InjectModel(Lesson.name) private readonly lessonModel: Model<Lesson>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(OrderDetail.name)
    private readonly orderDetailModel: Model<OrderDetail>,
    @InjectModel(UpcomingCourses.name)
    private readonly upcomingCoursesModel: Model<UpcomingCourses>,
    private eventEmitter: EventEmitter2,
  ) {
    super({
      [Course.name]: courseModel,
      [User.name]: userModel,
      [Lesson.name]: lessonModel,
    });
  }

  async createCourse(
    createCourseDto: CreateCourseDto,
    user: UserDocument,
    files?: Express.Multer.File[],
  ) {
    createCourseDto.slug ??= slug(createCourseDto.title);
    createCourseDto.seo = {
      title: createCourseDto.title,
    };
    createCourseDto.owner_id = user._id;
    try {
      const newCourse = await this.courseModel.create(createCourseDto);

      const courseThumbnail = files?.find((f) => f.fieldname === 'thumbnail');
      if (courseThumbnail) {
        validateImageFile(courseThumbnail, 'thumbnail');
        newCourse.thumbnail = await uploadFile(
          courseThumbnail,
          `${newCourse._id}-thumbnail`,
          'courses',
        );
      }

      if (
        createCourseDto.case_studies &&
        Array.isArray(createCourseDto.case_studies)
      ) {
        for (let i = 0; i < createCourseDto.case_studies.length; i++) {
          const thumbnailFile = files.find(
            (f) => f.fieldname === `case_studies[${i}][thumbnail]`,
          );

          if (thumbnailFile) {
            validateImageFile(thumbnailFile, `case_studies[${i}][thumbnail]`);
            newCourse.case_studies[i] = {
              description: createCourseDto.case_studies[i].description,
              thumbnail: await uploadFile(
                thumbnailFile,
                `${newCourse._id}-cst${i}`,
                'courses/case_studies',
              ),
            };
          }
        }
      }

      if (createCourseDto.events && Array.isArray(createCourseDto.events)) {
        for (let i = 0; i < createCourseDto.events.length; i++) {
          const thumbnailFile = files.find(
            (f) => f.fieldname === `events[${i}][image]`,
          );

          if (thumbnailFile) {
            validateImageFile(thumbnailFile, `events[${i}][image]`);
            newCourse.events[i] = {
              ...omit(createCourseDto.events[i], ['image']),
              image: await uploadFile(
                thumbnailFile,
                `${newCourse._id}-event${i}`,
                'courses/events',
              ),
            };
          }
        }
      }

      await newCourse.save();
      return newCourse;
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(
        error.message.startsWith('E11000') ? 'URL đã tồn tại' : error.message,
        500,
      );
    }
  }

  async editCourse(
    _id: Types.ObjectId,
    updateCourseDto: UpdateCourseDto,
    user: UserDocument,
    files?: Express.Multer.File[],
  ) {
    const course = await this.courseModel.findById(_id);

    if (!course) {
      throw new HttpException('Khóa học không tồn tại', 404);
    }

    try {
      const realUser = new this.userModel(omit(user, 'is_admin'));
      if (!realUser.isAdministrator() && !course.owner_id.equals(user._id))
        return Promise.reject(
          new HttpException('Bạn không có quyền sửa khóa học này', 403),
        );

      const courseThumbnail = files?.find((f) => f.fieldname === 'thumbnail');

      if (courseThumbnail) {
        validateImageFile(courseThumbnail, 'thumbnail');
        course.thumbnail = await uploadFile(
          courseThumbnail,
          `${course._id}-thumbnail`,
          'courses',
        );
      } else if (updateCourseDto.action_thumbnail === 'delete') {
        await deleteFile(course.thumbnail);
        course.thumbnail = undefined;
      }
      delete updateCourseDto.thumbnail;
      delete updateCourseDto.action_thumbnail;

      if (
        updateCourseDto.case_studies &&
        Array.isArray(updateCourseDto.case_studies)
      ) {
        for (let i = 0; i < updateCourseDto.case_studies.length; i++) {
          const thumbnailFile = files.find(
            (f) => f.fieldname === `case_studies[${i}][thumbnail]`,
          );

          course.case_studies[i] = {
            ...course.case_studies[i],
            ...updateCourseDto.case_studies[i],
          };

          if (thumbnailFile) {
            validateImageFile(thumbnailFile, `case_studies[${i}][thumbnail]`);
            course.case_studies[i].thumbnail = await uploadFile(
              thumbnailFile,
              `${course._id}-cst${i}`,
              'courses/case_studies',
            );
          } else if (updateCourseDto.case_studies[i].action === 'delete') {
            await deleteFile(course.case_studies[i].thumbnail);
            delete course.case_studies[i].thumbnail;
          }
        }
      }
      delete updateCourseDto.case_studies;

      if (updateCourseDto.events && Array.isArray(updateCourseDto.events)) {
        for (let i = 0; i < updateCourseDto.events.length; i++) {
          const thumbnailFile = files.find(
            (f) => f.fieldname === `events[${i}][image]`,
          );

          course.events[i] = {
            ...course.events[i],
            ...updateCourseDto.events[i],
          };

          if (thumbnailFile) {
            validateImageFile(thumbnailFile, `events[${i}][image]`);
            course.events[i].image = await uploadFile(
              thumbnailFile,
              `${course._id}-event${i}`,
              'courses/events',
            );
          } else if (updateCourseDto.events[i].action === 'delete') {
            await deleteFile(course.events[i].image);
            delete course.events[i].image;
          }
        }
      }
      delete updateCourseDto.events;

      if (
        updateCourseDto.instructors &&
        Array.isArray(updateCourseDto.instructors)
      ) {
        for (let i = 0; i < updateCourseDto.instructors.length; i++) {
          const thumbnailFile = files.find(
            (f) => f.fieldname === `instructors[${i}][avatar]`,
          );

          course.instructors[i] = {
            ...course.instructors[i],
            ...updateCourseDto.instructors[i],
          };

          if (thumbnailFile) {
            validateImageFile(thumbnailFile, `instructors[${i}][avatar]`);
            course.instructors[i].avatar = await uploadFile(
              thumbnailFile,
              `${course._id}-instructors${i}`,
              'courses/instructors',
            );
          } else if (updateCourseDto.instructors[i].action === 'delete') {
            await deleteFile(course.instructors[i].avatar);
            delete course.instructors[i].avatar;
          }
        }
      }
      delete updateCourseDto.instructors;

      const oldCohortCodes = (course.cohorts || [])
        .map((c) => c.code)
        .filter((code) => code !== undefined);
      const newCohortCodes = (updateCourseDto.cohorts || [])
        .map((c) => c.code)
        .filter((code) => code !== undefined);

      // Find cohorts that existed before but will be removed in the update
      const removedCohortCodes = oldCohortCodes.filter(
        (code) => !newCohortCodes.includes(code),
      );

      if (removedCohortCodes.length > 0) {
        // Check if any of the removed cohorts have paid students
        const cohortCodesWithPaidStudents =
          await this.getCohortsWithPaidStudents(course._id, removedCohortCodes);

        if (cohortCodesWithPaidStudents.length > 0) {
          throw new HttpException(
            `Không thể xóa lớp học ${cohortCodesWithPaidStudents.join(', ')} vì đã có học viên thanh toán`,
            400,
          );
        }
      }

      course.set(updateCourseDto);
      await course.save();
      // cập nhật lại lịch học sắp diễn ra
      await this.updateUpcomingCourse(course);
      return course;
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(
        error.message.startsWith('E11000') ? 'URL đã tồn tại' : error.message,
        500,
      );
    }
  }

  async updateUpcomingCourse(course: CourseDocument) {
    // xóa các lịch học cũ
    await this.upcomingCoursesModel.deleteMany({ course_id: course._id });
    const upcomingSchedules = course.getUpcomingSchedules(10);
    if (
      upcomingSchedules.length > 0 &&
      (course.status === CourseStatusEnum.OpenForSale ||
        course.status === CourseStatusEnum.WillOpen)
    ) {
      const nextSchedule = dayjs(upcomingSchedules[0]);
      await this.upcomingCoursesModel.create({
        course_id: course._id,
        recurrence_datetime: dayjs(nextSchedule).toDate(),
      });
    }
  }

  async getCourses(query: FindAllCourseDto, owner: UserDocument) {
    const realUser = new this.userModel(omit(owner, 'is_admin'));

    const match: FilterQuery<Course> = {};
    match.deleted_at = null;
    if (!(realUser.isAdministrator() && query.is_admin)) {
      match.owner_id = owner._id;
    }

    if (query.category_id) {
      match.category_id = query.category_id;
    }

    if (query.title) {
      match.title = {
        $regex: query.title,
        $options: 'si',
      };
    }

    if (!isUndefined(query.status)) {
      match.status = query.status;
    }

    return this.paginate(Course.name, match, {
      sort: { _id: -1 },
      skip: query.skip,
      limit: query.limit,
      populate: ['owner', 'total_students'],
    });
  }

  async findLessonsByCourse(
    courseId: Types.ObjectId,
    query: FindLessonByCourseDto,
    user: UserDocument,
  ) {
    const findData = {
      course_id: courseId,
      ...(query.in_parent && query.in_parent.length > 0
        ? { parent_id: { $in: query.in_parent } }
        : { parent_id: query.parent_id || null }),
    };

    const realUser = new this.userModel(omit(user, 'is_admin'));

    if (!realUser.isAdministrator()) {
      findData['author_id'] = user._id;
    }

    return this.paginate(Lesson.name, findData, {
      sort: { order: 1, _id: -1 },
      skip: query.skip,
      limit: query.limit,
    });
  }

  async saveChapterOrLesson(
    courseId: Types.ObjectId,
    body: SaveChapterOrLessonDto[],
    user?: UserDocument,
  ) {
    const course = await this.courseModel.findById(courseId);

    if (!course) {
      throw new HttpException('Khóa học không tồn tại', 404);
    }

    const realUser = new this.userModel(omit(user, 'is_admin'));
    if (!realUser.isAdministrator() && !course.owner_id.equals(user._id)) {
      throw new HttpException('Bạn không có quyền sửa khóa học này', 403);
    }

    const res = [];
    let orderChapter = 0;
    for (const ch of body) {
      const { children, ...chapterData } = ch;

      let chapterDoc: LessonDocument;
      if (Types.ObjectId.isValid(ch._id)) {
        chapterDoc = await this.lessonModel.findByIdAndUpdate(
          ch._id,
          {
            ...chapterData,
            order: orderChapter++,
            course_id: courseId,
            author_id: course.owner_id,
          },
          { new: true },
        );
      } else {
        chapterDoc = await this.lessonModel.create({
          ...omit(chapterData, ['_id']),
          order: orderChapter++,
          course_id: courseId,
          author_id: course.owner_id,
        });
      }

      const chapterObj = chapterDoc.toObject();
      chapterObj['children'] = [];

      if (children?.length) {
        let orderLesson = 0;

        for (const lesson of children) {
          let lessonDoc: LessonDocument;
          if (Types.ObjectId.isValid(lesson._id)) {
            lessonDoc = await this.lessonModel.findByIdAndUpdate(
              lesson._id,
              {
                ...lesson,
                order: orderLesson++,
                parent_id: chapterDoc._id,
                course_id: courseId,
                author_id: course.owner_id,
              },
              { new: true },
            );
          } else {
            lessonDoc = await this.lessonModel.create({
              ...omit(lesson, ['_id']),
              order: orderLesson++,
              parent_id: chapterDoc._id,
              course_id: courseId,
              author_id: course.owner_id,
            });
          }

          if (
            lessonDoc.material.type === LessonMaterialType.Stream &&
            !lessonDoc.material.zoom_meeting_id
          )
            this.eventEmitter.emit('lesson.zoom-create', { lesson: lessonDoc });

          chapterObj['children'].push(lessonDoc);
        }
      }

      res.push(chapterObj);
    }

    this.eventEmitter.emit('total_lesson_chapter.update', {
      course_id: courseId,
    });

    return res;
  }

  async getCohortsWithPaidStudents(
    courseId: Types.ObjectId,
    cohortCodes: string[],
  ): Promise<string[]> {
    if (!cohortCodes.length) return [];

    const paidDetails = await this.orderDetailModel.aggregate([
      {
        $match: {
          product_id: courseId,
          cohort_code: { $in: cohortCodes },
        },
      },
      {
        $lookup: {
          from: 'orders',
          localField: 'order_id',
          foreignField: '_id',
          as: 'order',
        },
      },
      { $unwind: '$order' },
      { $match: { 'order.payment_status': EPaymentStatus.Paid } },
      { $group: { _id: '$cohort_code' } },
    ]);
    return paidDetails.map((d) => d._id);
  }
}
