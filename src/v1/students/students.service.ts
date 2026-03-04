import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import {
  ClientSession,
  Connection,
  Model,
  PipelineStage,
  Types,
} from 'mongoose';
import { Course } from 'src/schemas/course.schema';
import { UserCourse } from 'src/schemas/user-course.schema';
import { User } from 'src/schemas/user.schema';
import { FilterStudentDto } from './dto/filter-student.dto';

@Injectable()
export class StudentsService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(Course.name)
    private readonly courseModel: Model<Course>,
    @InjectModel(UserCourse.name)
    private readonly userCourseModel: Model<UserCourse>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async mapCourses(
    userId: Types.ObjectId,
    courses: (
      | Types.ObjectId
      | string
      | { course_id: Types.ObjectId | string; cohort_code?: string }
    )[],
    session: ClientSession,
  ) {
    const user = await this.userModel.findById(userId).session(session);
    if (!user) {
      throw new NotFoundException('User không tồn tại');
    }

    const courseMappings = courses.map((c) => {
      if (typeof c === 'string' || c instanceof Types.ObjectId) {
        return { course_id: new Types.ObjectId(c), cohort_code: undefined };
      }
      return {
        course_id: new Types.ObjectId(c.course_id),
        cohort_code: c.cohort_code,
      };
    });

    const courseObjectIds = courseMappings.map((c) => c.course_id);
    const existingCourses = await this.courseModel
      .find({ _id: { $in: courseObjectIds } })
      .session(session);

    if (existingCourses.length !== courseObjectIds.length) {
      const existingIds = existingCourses.map((c) => c._id.toString());
      const invalidIds = courseObjectIds.filter(
        (id) => !existingIds.includes(id.toString()),
      );
      throw new BadRequestException(
        `Các course_id sau không hợp lệ: ${invalidIds.join(', ')}`,
      );
    }
    await Promise.all(
      existingCourses.map(async (course) => {
        const mapping = courseMappings.find(
          (m) => m.course_id.toString() === course._id.toString(),
        );

        const updateData: any = {
          ...(mapping?.cohort_code ? { cohort_code: mapping.cohort_code } : {}),
        };

        if (course.price_sell > 0) {
          updateData.paid = true;
        } else {
          updateData.free = true;
        }

        await this.userCourseModel.findOneAndUpdate(
          { user_id: userId, course_id: course._id },
          updateData,
          { upsert: true, new: true, session },
        );
      }),
    );

    return { message: 'Đã gán khóa học cho user thành công' };
  }

  async myCourses(userId: Types.ObjectId, query: FilterStudentDto) {
    const pipeline: PipelineStage[] = [
      { $match: { user_id: new Types.ObjectId(userId) } },
      {
        $lookup: {
          from: 'courses',
          localField: 'course_id',
          foreignField: '_id',
          as: 'course',
        },
      },
      { $unwind: '$course' },
    ];

    if (query.keyword) {
      pipeline.push({
        $match: { 'course.title': { $regex: query.keyword, $options: 'i' } },
      });
    }
    if (query.paid) {
      pipeline.push({
        $match: { $or: [{ paid: query.paid }, { free: true }] },
      });
    }

    return this.userCourseModel.aggregate(pipeline);
  }
}
