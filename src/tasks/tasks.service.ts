import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { isPrimaryCluster } from '../helper/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Course, CourseStatusEnum } from '../schemas/course.schema';
import dayjs from 'dayjs';
import { EmailRemindersSent } from '../schemas/email_reminders_sent.schema';
import { ZoomService } from '../zoom/zoom.service';
import { InjectMailer, Mailer } from 'nestjs-mailer';
import { template } from '../helper/email';
import { ConfigService } from '@nestjs/config';
import { Address } from 'nodemailer/lib/mailer';
import { UpcomingCourses } from 'src/schemas/upcoming_courses.schema';
import process from 'node:process';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectModel(Course.name)
    private readonly courseModel: Model<Course>,
    @InjectModel(EmailRemindersSent.name)
    private readonly emailRemindersSentModel: Model<EmailRemindersSent>,
    private zoomService: ZoomService,
    @InjectMailer() private readonly mailer: Mailer,
    @InjectModel(UpcomingCourses.name)
    private readonly upcomingCoursesModel: Model<UpcomingCourses>,
    private readonly configService: ConfigService,
  ) {}

  // Tự động mở bán khoá học khi đến thời điểm publish_at
  @Cron(CronExpression.EVERY_MINUTE)
  async openCourses() {
    if (process.env.APP_CLUSTER === 'true' && !isPrimaryCluster()) return;

    await this.courseModel.updateMany(
      {
        deleted_at: null,
        status: CourseStatusEnum.WillOpen,
        publish_at: { $lte: new Date() },
      },
      {
        $set: {
          status: CourseStatusEnum.OpenForSale,
          publish_at: undefined,
        },
      },
    );
  }

  // Xóa định kỳ các thông báo đã quá hạn
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async deleteEmailReminders() {
    if (process.env.APP_CLUSTER === 'true' && !isPrimaryCluster()) return;

    await this.emailRemindersSentModel.deleteMany({
      recurrence_datetime: { $lt: new Date() },
    });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async sentEmailToTeacher() {
    if (process.env.APP_CLUSTER === 'true' && !isPrimaryCluster()) return;

    const now = dayjs();
    const startOfDay = now.startOf('day').toDate();
    const endOfDay = now.add(1, 'day').endOf('day').toDate();

    const courses = await this.courseModel
      .find({
        deleted_at: null,
        status: {
          $in: [CourseStatusEnum.OpenForSale, CourseStatusEnum.WillOpen],
        },
        cohorts: {
          $elemMatch: {
            start_date: { $lte: endOfDay },
            $or: [
              { end_date: { $exists: false } },
              { end_date: { $gte: startOfDay } },
            ],
          },
        },
      })
      .populate('owner');

    for (const course of courses) {
      const upcomingSchedules = course.getUpcomingSchedules(1);
      if (upcomingSchedules.length > 0) {
        const nextSchedule = dayjs(upcomingSchedules[0]);

        if (
          nextSchedule.diff(dayjs(), 'day', true) <= 1 &&
          nextSchedule.diff(dayjs(), 'day', true) > 0
        ) {
          const alreadySent = await this.emailRemindersSentModel
            .exists({
              course_id: course._id,
              teacher_id: course.owner_id,
              recurrence_datetime: dayjs(nextSchedule).toDate(),
              type: 'before_1_day',
            })
            .then(Boolean);

          if (!alreadySent) {
            await this.emailRemindersSentModel.findOneAndUpdate(
              {
                course_id: course._id,
                teacher_id: course.owner_id,
                recurrence_datetime: nextSchedule.toDate(),
                type: 'before_1_day',
              },
              {},
              { upsert: true },
            );

            // Gửi email nhắc nhở cho giáo viên
            try {
              await this.mailer.sendMail({
                to: course.owner.email,
                from: this.configService.get<Address>('mail.from'),
                subject: '[MavenPath] Nhắc nhở: Chuẩn bị cho lịch học sắp tới',
                html: await template(
                  'src/templates/emails/before_schedule_reminder.ejs',
                  {
                    course_name: course.title,
                    to_name: course.owner.full_name,
                    recurrence_datetime:
                      nextSchedule.format('HH:mm, DD/MM/YYYY'),
                  },
                ),
              });
            } catch (e) {
              console.log(e);
            }
          }
        }

        if (
          nextSchedule.diff(dayjs(), 'hour', true) <= 1 &&
          nextSchedule.diff(dayjs(), 'hour', true) > 0
        ) {
          const alreadySent = await this.emailRemindersSentModel
            .exists({
              course_id: course._id,
              teacher_id: course.owner_id,
              recurrence_datetime: nextSchedule.toDate(),
              type: 'before_1_hour',
            })
            .then(Boolean);

          if (!alreadySent) {
            // tạo zoom meeting
            const zoom = await this.zoomService.createMeeting({
              topic: course.title,
              type: 2,
              start_time: nextSchedule.toISOString(),
              duration: 30 * 60, // duration in minutes, default to 60 if not set
              timezone: 'Asia/Ho_Chi_Minh',
              settings: {
                join_before_host: true,
              },
            });

            // Cập nhật thông tin Zoom vào khoá học
            course.zoom_join_url = zoom.join_url;
            course.zoom_password = zoom.password;
            course.zoom_meeting_id = zoom.id;
            await course.save();

            await this.emailRemindersSentModel.findOneAndUpdate(
              {
                course_id: course._id,
                teacher_id: course.owner_id,
                recurrence_datetime: nextSchedule.toDate(),
                type: 'before_1_hour',
              },
              {},
              { upsert: true },
            );

            // Gửi email nhắc nhở cho giáo viên
            try {
              await this.mailer.sendMail({
                to: course.owner.email,
                from: this.configService.get<Address>('mail.from'),
                subject: '[MavenPath] Nhắc nhở: Lịch học sắp diễn ra',
                html: await template(
                  'src/templates/emails/schedule_reminder.ejs',
                  {
                    course_name: course.title,
                    to_name: course.owner.full_name,
                    recurrence_datetime:
                      nextSchedule.format('HH:mm, DD/MM/YYYY'),
                    zoom_meeting_id: course.zoom_meeting_id,
                    zoom_password: course.zoom_password,
                    zoom_start_url: `${process.env.APP_URL}/zoom/${course._id}`,
                  },
                ),
              });
            } catch (e) {
              console.log(e);
            }
          }
        }
      }
    }
  }

  // Tự động thêm lịch học khi trong khóa học có lịch học gần nhất
  @Cron(CronExpression.EVERY_HOUR)
  async handleUpcomingCourseScheduleUpdate() {
    if (process.env.APP_CLUSTER === 'true' && !isPrimaryCluster()) return;
    const now = dayjs();
    const startOfDay = now.startOf('day').toDate();
    const endOfDay = now.endOf('day').toDate();

    // Xóa các lịch học cũ hơn ngày hôm nay
    await this.upcomingCoursesModel.deleteMany({
      recurrence_datetime: { $lt: startOfDay },
    });

    const courses = await this.courseModel.find({
      $or: [{ deleted_at: null }, { deleted_at: { $exists: false } }],
      status: {
        $in: [CourseStatusEnum.OpenForSale, CourseStatusEnum.WillOpen],
      },
      cohorts: {
        $elemMatch: {
          start_date: { $exists: true },
          $or: [
            { end_date: { $gte: startOfDay } },
            { end_date: null },
            { end_date: { $exists: false } },
          ],
        },
      },
    });
    for (const course of courses) {
      const upcomingSchedules = course.getUpcomingSchedules(1);
      if (
        upcomingSchedules.length === 0 ||
        dayjs(upcomingSchedules[0]).isAfter(dayjs().endOf('day'))
      ) {
        const existingCourseToday = await this.upcomingCoursesModel.findOne({
          course_id: course._id,
          recurrence_datetime: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        });

        if (existingCourseToday) {
          continue;
        }
      }
      await this.upcomingCoursesModel.deleteMany({ course_id: course._id });
      await this.upcomingCoursesModel.create({
        course_id: course._id,
        recurrence_datetime: dayjs(upcomingSchedules[0]).toDate(),
      });
    }
  }
}
