import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseService } from '../../base/base.service';
import { Course, CourseStatusEnum } from '../../schemas/course.schema';
import { FilterQuery, Model, PipelineStage, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { pipePagination } from '../../helper/pagination';
import { FindAllCourseDto, SortByCourseEnum } from './dto/find-all-course.dto';
import { User, UserDocument } from '../../schemas/user.schema';
import { isNil, isUndefined } from 'lodash';
import { UserCourse } from 'src/schemas/user-course.schema';
import { Lesson, LessonStatus } from '../../schemas/lesson.schema';
import { UpcomingCourses } from 'src/schemas/upcoming_courses.schema';
import { FindUpcomomgCourseDto } from './dto/find_upcoming_course.dto';
import { PageDto } from 'src/base/dto/page.dto';
import { PageMetaDto } from 'src/base/dto/page-meta.dto';
import { MapCompleteLesson } from 'src/schemas/map-complete-lesson.schema';
import { getLearingProgressDto } from './dto/get-learning-progress.dto';
import { FilterStudentDto } from '../students/dto/filter-student.dto';
import { ZoomService } from 'src/zoom/zoom.service';

@Injectable()
export class CoursesService extends BaseService {
  constructor(
    @InjectModel(Course.name) private readonly courseModel: Model<Course>,
    @InjectModel(Lesson.name) private readonly lessonModel: Model<Lesson>,
    @InjectModel(UserCourse.name)
    private readonly userCourseModel: Model<UserCourse>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(UpcomingCourses.name)
    private readonly upcomingCourseModel: Model<UpcomingCourses>,
    @InjectModel(MapCompleteLesson.name)
    private readonly mapCompleteLessonModel: Model<MapCompleteLesson>,
    private readonly zoomService: ZoomService,
  ) {
    super({
      [Course.name]: courseModel,
      [User.name]: userModel,
      [UserCourse.name]: userCourseModel,
    });
  }

  async getCourse(identifier: Types.ObjectId | string, user?: UserDocument) {
    const filter: FilterQuery<Course> = Types.ObjectId.isValid(identifier)
      ? { _id: new Types.ObjectId(identifier) }
      : { slug: identifier };

    if (isNil(user)) {
      Object.assign(filter, {
        status: { $nin: [CourseStatusEnum.Draft] },
        deleted_at: null,
      });
    }

    const pipeline: PipelineStage[] = [
      { $match: filter },

      // OWNER
      {
        $lookup: {
          from: 'teachers',
          localField: 'owner_id',
          foreignField: 'user_id',
          as: 'owner',
          pipeline: [{ $project: { full_name: 1, avatar: 1 } }],
        },
      },
      {
        $unwind: {
          path: '$owner',
          preserveNullAndEmptyArrays: true,
        },
      },
      // CATEGORY
      {
        $lookup: {
          from: 'categories',
          localField: 'category_id',
          foreignField: '_id',
          as: 'category',
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      {
        $unwind: {
          path: '$category',
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    const resultQuery = await this.courseModel.aggregate([
      ...pipeline,
      {
        $limit: 1,
      },
    ]);

    if (resultQuery.length === 0) throw new NotFoundException();
    return resultQuery.shift();
  }

  async getCourses(query: FindAllCourseDto, user?: UserDocument) {
    const cMatch: FilterQuery<Course> = {
      status: { $nin: [CourseStatusEnum.Draft] },
    };
    cMatch.deleted_at = null;

    if (query.is_free) {
      cMatch.price_sell = 0;
    }

    if (query.category_id) {
      cMatch.category_id = query.category_id;
    }
    if (query.title) {
      cMatch.title = {
        $regex: query.title,
        $options: 'si',
      };
    }

    if (query.owner_id) {
      cMatch.owner_id = query.owner_id;
    }

    if (!isUndefined(query.status)) {
      cMatch.status = query.status;
    } else {
      cMatch.status = CourseStatusEnum.OpenForSale;
    }
    const sortPage: Record<string, 1 | -1> = {};
    switch (query?.sort_by_course) {
      case SortByCourseEnum.LowToHigh:
        sortPage.price_sell = 1;
        break;
      case SortByCourseEnum.HighToLow:
        sortPage.price_sell = -1;
        break;
      case SortByCourseEnum.RatingHighToLow:
        sortPage.rating_average = -1;
        break;
      case SortByCourseEnum.Top:
        sortPage.total_students = -1;
        sortPage.rating_average = -1;
        break;
      default:
        sortPage.updated_at = -1;
        sortPage._id = -1;
        break;
    }

    const pipeline: PipelineStage[] = [
      {
        $match: cMatch,
      },
      {
        $lookup: {
          from: 'teachers',
          localField: 'owner_id',
          foreignField: 'user_id',
          as: 'owner',
          pipeline: [
            {
              $project: {
                full_name: 1,
                avatar: 1,
              },
            },
            { $limit: 1 },
          ],
        },
      },
      {
        $unwind: {
          path: '$owner',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category_id',
          foreignField: '_id',
          as: 'category',
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      {
        $unwind: {
          path: '$category',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'course_id',
          as: 'reviews',
          pipeline: [{ $project: { rating: 1 } }],
        },
      },
      {
        $addFields: {
          rating_average: { $ifNull: [{ $avg: '$reviews.rating' }, 0] },
          rating_count: { $size: '$reviews' },
        },
      },
      {
        $project: {
          reviews: 0,
        },
      },
    ];

    if (query.sort_by_course === SortByCourseEnum.Top) {
      pipeline.push(
        {
          $lookup: {
            from: 'user_courses',
            localField: '_id',
            foreignField: 'course_id',
            as: 'participants',
            pipeline: [{ $project: { _id: 1 } }],
          },
        },
        {
          $addFields: {
            total_students: { $size: '$participants' },
          },
        },
        {
          $project: {
            participants: 0,
          },
        },
      );
    }

    pipeline.push(
      {
        $sort: sortPage,
      },
      ...(query.all ? [] : pipePagination(query.page, query.limit)),
    );

    const resultQuery = await this.courseModel.aggregate([...pipeline], {
      allowDiskUse: true,
    });
    return query.all ? resultQuery : resultQuery.shift();
  }

  async getCourseLessons(id: Types.ObjectId, user?: UserDocument) {
    const lessonChildPipeline: any[] = [
      { $match: { status: LessonStatus.Published } },
    ];

    // Nếu có user thì thêm bước lookup trạng thái hoàn thành
    if (user?._id) {
      lessonChildPipeline.push(
        {
          $lookup: {
            from: 'map_complete_lessons',
            let: { lessonId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$lesson_id', '$$lessonId'] },
                      { $eq: ['$user_id', user._id] },
                    ],
                  },
                },
              },
              { $project: { status: 1, _id: 0 } },
              { $limit: 1 },
            ],
            as: 'complete_info',
          },
        },
        {
          $addFields: {
            status_complete: {
              $arrayElemAt: ['$complete_info.status', 0],
            },
          },
        },
        {
          $project: {
            complete_info: 0,
          },
        },
      );
    }

    return this.lessonModel.aggregate([
      { $match: { course_id: id } },
      {
        $facet: {
          chapters: [
            { $match: { parent_id: { $exists: false } } },
            {
              $lookup: {
                from: 'lessons',
                localField: '_id',
                foreignField: 'parent_id',
                as: 'lessons_child',
                pipeline: lessonChildPipeline,
              },
            },
          ],
        },
      },
      { $unwind: '$chapters' },
      { $replaceRoot: { newRoot: '$chapters' } },
    ]);
  }

  async getSuccessLessonCount(
    query: getLearingProgressDto,
    user: UserDocument,
  ) {
    const completedLessons = await this.mapCompleteLessonModel.find({
      course_id: { $in: query.course_ids },
      user_id: user._id,
      status: 1,
    });

    const countMap: Record<string, number> = {};

    for (const lesson of completedLessons) {
      const courseId = lesson.course_id.toString();
      countMap[courseId] = (countMap[courseId] || 0) + 1;
    }

    return query.course_ids.map((id) => ({
      course_id: id,
      totalCompleteLesson: countMap[id.toString()] || 0,
    }));
  }

  async getUpcomingCourses(
    query: FindUpcomomgCourseDto,
    user_id?: Types.ObjectId,
  ) {
    let result = [];
    const data = await this.upcomingCourseModel
      .find()
      .sort({ recurrence_datetime: 1 })
      .skip(query.skip)
      .limit(query.limit)
      .populate({
        path: 'course',
        populate: [
          {
            path: 'owner',
            model: 'Teacher',
            select: 'full_name avatar',
          },
        ],
      });
    if (user_id) {
      const courseIds = data.map((item) => item.course_id).filter(Boolean);

      const userCourses = await this.userCourseModel
        .find({
          user_id,
          course_id: { $in: courseIds },
          $or: [{ free: true }, { paid: true }],
        })
        .select('course_id');

      const boughtCourseIds = new Set(
        userCourses.map((uc) => uc.course_id.toString()),
      );

      result = data.map((item) => ({
        ...item.toObject(),
        is_had_bought: boughtCourseIds.has(item.course_id.toString()),
      }));
    } else {
      result = data.map((item) => ({
        ...item.toObject(),
        is_had_bought: false,
      }));
    }
    const itemCount = await this.upcomingCourseModel.countDocuments();
    return new PageDto<UpcomingCourses>(
      result,
      new PageMetaDto({
        pageOptionsDto: query,
        itemCount,
      }),
    );
  }

  async getStudents(
    courseId: Types.ObjectId | string,
    query: FilterStudentDto,
  ) {
    const courseObjId = new Types.ObjectId(courseId);

    const pipeline: PipelineStage[] = [
      {
        $match: { course_id: courseObjId, deleted_at: null },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },

      {
        $lookup: {
          from: 'courses',
          localField: 'course_id',
          foreignField: '_id',
          as: 'course',
        },
      },
      { $unwind: '$course' },
      {
        $lookup: {
          from: 'map_complete_lessons',
          let: { userId: '$user_id', courseId: '$course_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$user_id', '$$userId'] },
                    { $eq: ['$course_id', '$$courseId'] },
                  ],
                },
              },
            },
          ],
          as: 'completedLessons',
        },
      },
      {
        $addFields: {
          completed_lessons: {
            $size: { $ifNull: ['$completedLessons', []] },
          },

          progress_percent: {
            $cond: [
              { $gt: ['$course.total_lesson', 0] },
              {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          { $size: { $ifNull: ['$completedLessons', []] } },
                          '$course.total_lesson',
                        ],
                      },
                      100,
                    ],
                  },
                  0,
                ],
              },
              0,
            ],
          },
        },
      },
    ];
    if (query.keyword) {
      const regex = new RegExp(query.keyword, 'i');
      pipeline.push({
        $match: {
          $or: [
            { 'user.full_name': regex },
            { 'user.email': regex },
            { 'user.phone': regex },
          ],
        },
      });
    }
    pipeline.push(
      {
        $project: {
          _id: '$user._id',
          full_name: '$user.full_name',
          email: '$user.email',
          phone: '$user.phone',
          avatar: '$user.avatar',
          created_at: 1,
          progress_percent: 1,
          user_course_id: '$_id',
          cohort_code: 1,
        },
      },
      ...pipePagination(query.page, query.limit),
    );

    const result = await this.userCourseModel.aggregate(pipeline);
    return result.shift();
  }

  async getZoomSignature(courseId: Types.ObjectId, user: UserDocument) {
    const course = await this.courseModel.findById(courseId);

    if (!course) {
      throw new NotFoundException('Khoá học không tồn tại');
    }

    let role = 0; // Default to attendee
    if (course.owner_id.equals(user._id)) role = 1;

    return {
      signature: await this.zoomService.generateSignature(
        course.zoom_meeting_id,
        role,
      ),
      zak: role === 1 ? await this.zoomService.getHostZAKToken() : undefined,
      email: role === 1 ? 'tmtung144@gmail.com' : undefined,
    };
  }
}
