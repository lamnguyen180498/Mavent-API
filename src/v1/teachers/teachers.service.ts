import { HttpException, Injectable } from '@nestjs/common';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { User, UserDocument } from '../../schemas/user.schema';
import { Model, PipelineStage, Types } from 'mongoose';
import { RegistrationStatus, Teacher } from '../../schemas/teacher.schema';
import { InjectModel } from '@nestjs/mongoose';
import { generateRandomPin, uploadFile } from '../../helper/common';
import { FindTeacherDto } from './dto/find-teacher.dto';
import { isUndefined } from 'lodash';
import { pipePagination } from '../../helper/pagination';
import { BaseService } from '../../base/base.service';
import { HttpStatusCode } from 'axios';
import { FilterCourseTeacherDto } from './dto/filter-course-teacher.dto';
import { Course, CourseStatusEnum } from 'src/schemas/course.schema';
import { UserCourse } from '../../schemas/user-course.schema';
import { OrderDetail } from '../../schemas/order-detail.schema';

@Injectable()
export class TeachersService extends BaseService {
  constructor(
    @InjectModel(Teacher.name)
    private readonly teacherModel: Model<Teacher>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(Course.name)
    private readonly courseModel: Model<Course>,
    @InjectModel(UserCourse.name)
    private readonly userCourseModel: Model<UserCourse>,
    @InjectModel(OrderDetail.name)
    private readonly orderDetailModel: Model<OrderDetail>,
  ) {
    super({ [Teacher.name]: teacherModel });
  }

  async registerTeacher(
    createTeacherDto: CreateTeacherDto,
    files: {
      cic_card_front_image?: Express.Multer.File[];
      cic_card_back_image?: Express.Multer.File[];
    },
    user: UserDocument,
  ) {
    const checkTeacher = await this.teacherModel.findOne({
      user_id: user._id,
      status: { $ne: RegistrationStatus.Rejected },
    });

    if (checkTeacher) {
      throw new HttpException(
        'Bạn đã đăng ký giảng viên trước đó',
        HttpStatusCode.BadRequest,
      );
    }
    const info = {
      email: user.email,
      sex: user.sex,
      birthday: user.birthday,
      city_id: user.city_id,
      ward_id: user.ward_id,
      avatar: user.avatar,
      ...createTeacherDto,
      user_id: user._id,
    };
    const cic_card_front_image = files.cic_card_front_image[0];
    const cic_card_back_image = files.cic_card_back_image[0];
    if (cic_card_front_image) {
      const urlImage = await uploadFile(
        cic_card_front_image,
        `${generateRandomPin()}_${Date.now()}_cic`,
        'cic',
      );
      Object.assign(info, { cic_card_front_image: urlImage });
    }

    if (cic_card_back_image) {
      const urlImage = await uploadFile(
        cic_card_back_image,
        `${generateRandomPin()}_${Date.now()}_cic`,
        'cic',
      );
      Object.assign(info, { cic_card_back_image: urlImage });
    }
    return await this.teacherModel.create(info);
  }

  async remove(id: Types.ObjectId) {
    return this.teacherModel.deleteOne({ _id: id });
  }

  async findAllTeacher(query: FindTeacherDto) {
    const isPaginate = isUndefined(query.is_paginate) || query.is_paginate;
    const match: Record<string, any> = {
      status: { $ne: RegistrationStatus.Rejected },
    };
    if (query.status) {
      match.status = query.status;
    }
    const pipeline: PipelineStage[] = [
      {
        $match: match,
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user',
          pipeline: [
            {
              $project: {
                full_name: 1,
                email: 1,
                avatar: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'courses',
          let: { userId: '$user_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$owner_id', '$$userId'] },
                    { $eq: ['$status', CourseStatusEnum.OpenForSale] },
                    {
                      $or: [
                        { $eq: ['$deleted_at', null] },
                        { $eq: ['$deleted_at', ''] },
                        { $not: ['$deleted_at'] },
                      ],
                    },
                  ],
                },
              },
            },
            {
              $count: 'course_count',
            },
          ],
          as: 'course_info',
        },
      },
      {
        $addFields: {
          course_count: {
            $ifNull: [{ $arrayElemAt: ['$course_info.course_count', 0] }, 0],
          },
        },
      },
      {
        $match: query.have_course ? { course_count: { $gt: 0 } } : {},
      },
      {
        $project: {
          course_info: 0,
        },
      },
    ];

    if (query.keyword) {
      pipeline.push({
        $match: {
          $or: [
            { full_name: { $regex: query.keyword, $options: 'i' } },
            { phone: { $regex: query.keyword, $options: 'i' } },
            { 'user.full_name': { $regex: query.keyword, $options: 'i' } },
            { 'user.email': { $regex: query.keyword, $options: 'i' } },
            { 'user.phone': { $regex: query.keyword, $options: 'i' } },
          ],
        },
      });
    }
    if (isPaginate) {
      pipeline.push(...pipePagination(query.page, query.limit));
    }

    const resultQuery = await this.teacherModel.aggregate(pipeline, {
      allowDiskUse: true,
    });

    if (isPaginate) {
      return resultQuery.shift();
    }

    return resultQuery;
  }

  updateStatus(id: Types.ObjectId, status: RegistrationStatus) {
    return this.teacherModel.updateOne(
      { _id: id },
      {
        $set: { status },
      },
    );
  }

  async getTeacherInfo(id: Types.ObjectId) {
    const teacherData = await this.teacherModel
      .findById(id)
      .populate('city', 'name')
      .populate('user_id');
    if (!teacherData) {
      throw new HttpException(
        'Thông tin giảng viên không tồn tại',
        HttpStatusCode.NotFound,
      );
    }

    return {
      ...teacherData.toObject(),
      city_name: teacherData.city?.name,
      user: teacherData.user_id,
    };
  }

  async getCourses(teacherId: Types.ObjectId, query: FilterCourseTeacherDto) {
    const pipeline: PipelineStage[] = [
      {
        $match: {
          owner_id: teacherId,
          deleted_at: null,
        },
      },
      {
        $project: {
          title: 1,
          slug: 1,
          description: 1,
          thumbnail: 1,
          status: 1,
          created_at: 1,
          updated_at: 1,
          owner_id: 1,
        },
      },
      ...pipePagination(query.page, query.limit),
    ];

    const result = await this.courseModel.aggregate(pipeline, {
      allowDiskUse: true,
    });

    return result.shift();
  }

  async getStatistics(user: UserDocument, query) {
    const courses = await this.courseModel.find({
      owner_id: user._id,
      deleted_at: null,
    });
    const courseIds = courses.map((course) => course._id);

    // Date filter condition
    const { from_date, to_date } = query;

    const dateFilter: any = {};
    if (from_date || to_date) {
      dateFilter.created_at = {};
      if (from_date) {
        const start = new Date(from_date);
        start.setHours(0, 0, 0, 0); // Đầu ngày
        dateFilter.created_at.$gte = start;
      }
      if (to_date) {
        const end = new Date(to_date);
        end.setHours(23, 59, 59, 999); // Cuối ngày
        dateFilter.created_at.$lte = end;
      }
    }
    // 2. Total Revenue
    const revenueStats = await this.orderDetailModel.aggregate([
      {
        $match: {
          product_id: { $in: courseIds },
          ...dateFilter,
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
      {
        $unwind: '$order',
      },
      {
        $match: {
          'order.payment_status': 1, // Paid
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total_money' },
        },
      },
    ]);

    const totalRevenue =
      revenueStats.length > 0 ? revenueStats[0].totalRevenue : 0;

    // 3. Total Students
    const studentStats = await this.userCourseModel.aggregate([
      {
        $match: {
          ...dateFilter // Filter enrollment date
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: 'course_id',
          foreignField: '_id',
          as: 'course',
        },
      },
      {
        $unwind: '$course',
      },
      {
        $match: {
          'course._id': { $in: courseIds },
        },
      },
      {
        $group: {
          _id: '$user_id',
        },
      },
      {
        $count: 'totalStudents',
      },
    ]);

    const totalStudents =
      studentStats.length > 0 ? studentStats[0].totalStudents : 0;

    return {
      total_course: courses.length,
      total_revenue: totalRevenue,
      total_students: totalStudents,
    };
  }
}
