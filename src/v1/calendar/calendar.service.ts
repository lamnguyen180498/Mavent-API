import { Injectable } from '@nestjs/common';
import { Model, PipelineStage, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Course } from '../../schemas/course.schema';
import { UserCourse } from '../../schemas/user-course.schema';
import { forEach } from 'lodash';
import dayjs from 'dayjs';

@Injectable()
export class CalendarService {
  constructor(
    @InjectModel(Course.name) private readonly courseModel: Model<Course>,
    @InjectModel(UserCourse.name)
    private readonly userCourseModel: Model<UserCourse>,
  ) {}
  async findByUser(userID: Types.ObjectId) {
    const pipeline: PipelineStage[] = [
      {
        $match: { user_id: userID },
      },
      {
        $lookup: {
          from: 'courses',
          localField: 'course_id',
          foreignField: '_id',
          as: 'course',
          pipeline: [
            {
              $match: {
                cohorts: { $exists: true, $ne: [] }, // có lịch học
              },
            },
            {
              $lookup: {
                from: 'users',
                localField: 'owner_id',
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
          ],
        },
      },
      {
        $unwind: {
          path: '$course',
          preserveNullAndEmptyArrays: false,
        },
      },
    ];

    const userCourses = await this.userCourseModel.aggregate(pipeline, {
      allowDiskUse: true,
    });
    let count = 0;
    const calendar: any[] = [];

    forEach(userCourses, (userCourse) => {
      forEach(userCourse.course.cohorts, (cohort) => {
        const startDate = dayjs(cohort.start_date);
        const endDate = dayjs(cohort.end_date);

        forEach(cohort.recurrences, (recurrence) => {
          // frequency: ["MO","WE","FR","SU"]
          const freqDays = recurrence.frequency;

          // Lặp qua từng ngày trong khoảng startDate → endDate
          let current = startDate.clone();
          while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
            // Kiểm tra nếu hôm nay nằm trong frequency
            const dayCode = current.format('dd').toUpperCase(); // ví dụ: "MO", "TU"
            if (freqDays.includes(dayCode)) {
              // Ghép start_date + start_time
              const start = dayjs(
                `${current.format('YYYY-MM-DD')}T${recurrence.start_time}`,
              );
              const end = dayjs(
                `${current.format('YYYY-MM-DD')}T${recurrence.end_time}`,
              );

              calendar.push({
                id: count++,
                title: `${userCourse.course.title} - GV:  ${userCourse.course.teacher.full_name}`,
                start: start.toDate(),
                end: end.toDate(),
              });
            }
            current = current.add(1, 'day');
          }
        });
      });
    });

    return calendar;
  }

  async findByTeacher(userID: Types.ObjectId) {
    const courses = await this.courseModel
      .find({ owner_id: userID, cohorts: { $exists: true, $ne: [] } })
      .exec();

    let count = 0;
    const calendar: any[] = [];

    forEach(courses, (course) => {
      forEach(course.cohorts, (cohort) => {
        const startDate = dayjs(cohort.start_date);
        const endDate = dayjs(cohort.end_date);
        console.log(cohort.recurrences);
        forEach(cohort.recurrences, (recurrence) => {
          // frequency: ["MO","WE","FR","SU"]
          const freqDays = recurrence['frequency'];

          // Lặp qua từng ngày trong khoảng startDate → endDate
          let current = startDate.clone();
          while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
            // Kiểm tra nếu hôm nay nằm trong frequency
            const dayCode = current.format('dd').toUpperCase(); // ví dụ: "MO", "TU"
            if (freqDays.includes(dayCode)) {
              // Ghép start_date + start_time
              const start = dayjs(
                `${current.format('YYYY-MM-DD')}T${recurrence['start_time']}`,
              );
              const end = dayjs(
                `${current.format('YYYY-MM-DD')}T${recurrence['end_time']}`,
              );

              calendar.push({
                id: count++,
                title: `${course.title}`,
                start: start.toDate(),
                end: end.toDate(),
              });
            }
            current = current.add(1, 'day');
          }
        });
      });
    });

    return calendar;
  }
}
