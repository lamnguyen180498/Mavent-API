import { Injectable } from '@nestjs/common';
import { BaseService } from '../../base/base.service';
import { InjectModel } from '@nestjs/mongoose';
import { UserCourse } from '../../schemas/user-course.schema';
import { Model, PipelineStage } from 'mongoose';
import { ListOfStudentCourseDto } from './dto/list-of-student-course';
import { UserDocument } from '../../schemas/user.schema';
import { isUndefined } from 'lodash';
import { pipePagination } from '../../helper/pagination';
import { ListOfByTeacherDto } from './dto/list-of-teacher-course';

@Injectable()
export class UserCourseService extends BaseService {
  constructor(
    @InjectModel(UserCourse.name)
    private readonly userCourseModel: Model<UserCourse>,
  ) {
    super({ [UserCourse.name]: userCourseModel });
  }

  async listOfStudentCourse(query: ListOfStudentCourseDto, user: UserDocument) {
    const isPaginate = isUndefined(query.is_paginate) || query.is_paginate;

    const pipeline: PipelineStage[] = [
      {
        $match: { user_id: user._id },
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
        $unwind: {
          path: '$course',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'teachers',
          localField: 'teacher_id',
          foreignField: '_id',
          as: 'teacher',
        },
      },
      {
        $unwind: {
          path: '$teacher',
          preserveNullAndEmptyArrays: true,
        },
      },
    ];
    if (query.keyword) {
      const keywordRegex = new RegExp(query.keyword, 'i'); //
      pipeline.push({
        $match: {
          'course.name': { $regex: keywordRegex },
        },
      });
    }
    if (query.is_free) {
      pipeline.push({
        $match: {
          'course.is_free': true,
        },
      });
    } else {
      pipeline.push({
        $match: {
          'course.is_paid': true,
        },
      });
    }
    if (isPaginate) {
      pipeline.push(...pipePagination(query.page, query.limit));
    }

    const resultQuery = await this.userCourseModel.aggregate(pipeline, {
      allowDiskUse: true,
    });

    if (isPaginate) {
      return resultQuery.shift();
    }

    return resultQuery;
  }

  async listOfCourseByTeacher(query: ListOfByTeacherDto, user: UserDocument) {
    const isPaginate = isUndefined(query.is_paginate) || query.is_paginate;
    const pipeline: PipelineStage[] = [
      {
        $lookup: {
          from: 'courses',
          let: { c_id: '$course_id' }, // Khai báo biến từ collection gốc
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$_id', '$$c_id'] }, // Khớp ID
                    { $eq: ['$owner_id', user._id] }, // Lọc theo chủ sở hữu
                  ],
                },
              },
            },
          ],
          as: 'course',
        },
      },
      {
        $unwind: {
          path: '$course',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'student',
        },
      },
      {
        $unwind: {
          path: '$student',
          preserveNullAndEmptyArrays: true,
        },
      },{
        $project: {
          _id: 1,
          course_id: 1,
          user_id: 1,
          course: 1,
          paid:1,
          is_free:1,
          student_name: '$student.full_name',
          course_title: '$course.title',
        }
      }
    ];
    if (query.keyword) {
      const keywordRegex = new RegExp(query.keyword, 'i'); //
      pipeline.push({
        $match: {
          'course.name': { $regex: keywordRegex },
        },
      });
    }
    if (isPaginate) {
      pipeline.push(...pipePagination(query.page, query.limit));
    }

    const resultQuery = await this.userCourseModel.aggregate(pipeline, {
      allowDiskUse: true,
    });

    if (isPaginate) {
      return resultQuery.shift();
    }

    return resultQuery;
  }
}
