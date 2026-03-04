import { HydratedDocument, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ObjectIdArrayTransform } from '../common/transforms/object-id-array.transform';
import { SEO } from '../common/seo';
import { ObjectIdTransform } from '../common/transforms/objectid.transform';
import { RRule, Weekday } from 'rrule';
import { UserDocument } from './user.schema';
import dayjs from 'dayjs';

export type CourseDocument = HydratedDocument<Course>;

export const weekdayMap: Record<string, Weekday> = {
  MO: RRule.MO,
  TU: RRule.TU,
  WE: RRule.WE,
  TH: RRule.TH,
  FR: RRule.FR,
  SA: RRule.SA,
  SU: RRule.SU,
};

export enum StudyTermEnum {
  UnLimit = 'unlimit',
  Limit = 'limit',
  LimitDay = 'limit-day',
}

export enum CourseOpeningConditionEnum {
  Always = 1, // Luôn mở
  OpenPrevious = 2, // Hoàn thành khóa học trước
}

export enum LessonOpeningConditionEnum {
  All = 1, // Mở tất cả bài học
  Sequence = 2, // Mở từng bài học
  AfterCompletePrevious = 3, // Mở bài học tiếp theo sau khi hoàn thành bài trước đó
}

export enum CourseStatusEnum {
  Draft = -1, // nháp
  OpenForSale = 1, // mở bán
  StopSelling = 2, // ngừng bán
  WillOpen = 3, // sẽ mở
}

export enum SortByEnum {
  Latest = 'latest',
  PriceSellLow = 'price_low',
  PriceSellHigh = 'price_high',
  OrderAsc = 'order_asc',
  OrderDesc = 'order_desc',
}

const weekDayKeys = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'] as const;

export class CourseRecurrence {
  @IsString({ message: 'Vui lòng nhập thời gian bắt đầu' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Định dạng thời gian không hợp lệ (đúng dạng HH:mm)',
  })
  start_time: string;

  @IsString({ message: 'Vui lòng nhập thời gian kết thúc' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Định dạng thời gian không hợp lệ (đúng dạng HH:mm)',
  })
  end_time: string;

  @IsArray({ message: 'Vui lòng chọn ít nhất một ngày trong tuần' })
  @ArrayNotEmpty({ message: 'Vui lòng chọn ít nhất một ngày trong tuần' })
  @IsIn(weekDayKeys, {
    each: true,
    message: `Ngày trong tuần không hợp lệ. Vui lòng chọn từ T2, T3, T4, T5, T6, T7, CN`,
  })
  frequency: string[];
}

export class CourseCohort {
  @IsBoolean()
  show_start_date: boolean;

  @IsString()
  @IsOptional()
  code?: string;

  @Type(() => Date)
  @IsDate({ message: 'Vui lòng nhập ngày bắt đầu' })
  start_date: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Ngày kết thúc không hợp lệ' })
  end_date?: Date | null;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'Phải có ít nhất một lịch học' })
  @ValidateNested({ each: true })
  @Type(() => CourseRecurrence)
  recurrences: CourseRecurrence;
}

export class Audience {
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Mô tả không được để trống' })
  description: string;
}

export class Faq {
  @IsString()
  @IsNotEmpty({ message: 'Câu hỏi không được để trống' })
  question: string;

  @IsString()
  @IsNotEmpty({ message: 'Câu trả lời không được để trống' })
  answer: string;
}

export class CaseStudy {
  thumbnail: string;

  @IsString()
  @IsNotEmpty({ message: 'Mô tả là bắt buộc' })
  description: string;

  @IsOptional()
  @IsString()
  action?: string; // 'delete' | 'upload';
}

export class Event {
  image: string;

  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề là bắt buộc' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Mô tả là bắt buộc' })
  description: string;

  @IsOptional()
  @IsString()
  link?: string;

  @Type(() => Date)
  @IsDate({ message: 'Ngày bắt đầu không hợp lệ' })
  start_date?: Date;

  @IsOptional()
  @IsString()
  action?: string; // 'delete' | 'upload';
}

export class Instructor {
  avatar: string;

  @IsString()
  @IsNotEmpty({ message: 'Họ tên là bắt buộc' })
  @Prop()
  full_name: string;

  @IsString()
  @IsNotEmpty({ message: 'Chức danh là bắt buộc' })
  title: string;

  @IsString()
  @IsOptional({ message: 'Chức danh' })
  url?: string;

  @IsString()
  @IsNotEmpty({ message: 'Kinh nghiệm là bắt buộc' })
  experience: string;

  @IsString()
  @IsNotEmpty({ message: 'Giới thiệu là bắt buộc' })
  bio: string;

  @IsOptional()
  @IsString()
  action?: string; // 'delete' | 'upload';

  template?: string;
}

@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  strict: 'throw',
  toJSON: {
    virtuals: true,
  },
  toObject: {
    virtuals: true,
  },
})
export class Course {
  @ApiPropertyOptional({ description: 'Thứ tự hiển thị khóa học' })
  @IsOptional()
  @Prop({ type: Number, required: false, default: 0 })
  order: number;

  @ApiPropertyOptional({ description: 'Điểm đánh giá trung bình' })
  @IsOptional()
  @Prop({ type: Number, required: false, default: 0 })
  rating_average: number;

  @ApiPropertyOptional({ description: 'Số lượt đánh giá' })
  @IsOptional()
  @Prop({ type: Number, required: false, default: 0 })
  rating_count: number;

  @ApiProperty({ enum: CourseStatusEnum, default: CourseStatusEnum.Draft })
  @Prop({
    required: true,
    default: CourseStatusEnum.Draft,
    enum: CourseStatusEnum,
  })
  @IsEnum(CourseStatusEnum)
  @Type(() => Number)
  status: CourseStatusEnum;

  @ApiPropertyOptional({
    description: 'Ngày mở bán khóa học',
  })
  @IsOptional()
  @ValidateIf((o) => o.status === CourseStatusEnum.WillOpen)
  @Type(() => Date)
  @IsDate()
  @Prop()
  publish_at?: Date;

  @ApiProperty({ description: 'Giảng viên sở hữu', type: String })
  @Prop({
    type: Types.ObjectId,
  })
  @IsOptional()
  @Transform(ObjectIdTransform)
  owner_id: Types.ObjectId;

  @ApiProperty({ description: 'Tên khóa học' })
  @Prop({ required: true })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Giới thiệu ngắn' })
  @IsOptional()
  @Prop({ required: false })
  introduce: string;

  @ApiPropertyOptional({
    description: 'Lý do học viên nên tham gia khóa học của bạn',
  })
  @IsOptional()
  @Prop({ required: false })
  reason: string;

  @ApiPropertyOptional({
    description: 'Thời lượng (tuần)',
  })
  @IsOptional()
  @IsNumber()
  @Prop()
  duration: number;

  @ApiPropertyOptional({ description: 'Mô tả chi tiết' })
  @IsOptional()
  @Prop({ required: false })
  description: string;

  @ApiPropertyOptional({
    description: 'Hình thức học',
    default: 'online',
  })
  @IsOptional()
  @Prop({ required: false, default: 'online' })
  mode: string;

  @ApiPropertyOptional({
    description: 'Thời hạn học',
    default: StudyTermEnum.UnLimit,
    enum: StudyTermEnum,
  })
  @IsOptional()
  @IsEnum(StudyTermEnum)
  @Prop({ required: false, default: StudyTermEnum.UnLimit })
  type_expired: StudyTermEnum;

  @ApiPropertyOptional({ description: 'Có thời hạn ... tháng' })
  @IsOptional()
  @ValidateIf((o) => o.type_expired === StudyTermEnum.Limit)
  @IsNumber()
  @Min(1)
  @Prop({ required: false, default: 0 })
  month_expired?: number;

  @ApiPropertyOptional({ description: 'Có thời hạn ... ngày' })
  @IsOptional()
  @ValidateIf((o) => o.type_expired === StudyTermEnum.LimitDay)
  @IsNumber()
  @Min(1)
  @Prop({ required: false, default: 0 })
  day_expired?: number;

  @ApiPropertyOptional({ description: 'Danh mục', type: String })
  @Prop({ type: Types.ObjectId })
  @IsOptional()
  @Transform(ObjectIdTransform)
  category_id?: Types.ObjectId;

  @ApiPropertyOptional({ description: 'Hình đại diện' })
  @IsOptional()
  @Prop({ required: false })
  thumbnail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(
    /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|vimeo\.com\/)\S+$/,
    {
      message: 'Liên kết phải là YouTube hoặc Vimeo',
    },
  )
  @Prop({ required: false })
  video?: string;

  @ApiPropertyOptional({ description: 'Khóa học liên quan' })
  @IsOptional()
  @Transform(ObjectIdArrayTransform)
  @Prop({ type: [{ type: Types.ObjectId }] })
  relates: Types.ObjectId[];

  @ApiPropertyOptional({
    description: 'Điều kiện học khóa học',
    enum: CourseOpeningConditionEnum,
    default: CourseOpeningConditionEnum.Always,
  })
  @IsOptional()
  @IsEnum(CourseOpeningConditionEnum, {
    message: 'Điều kiện học khóa học không hợp lệ',
  })
  @Type(() => Number)
  @Prop({
    type: Number,
    default: CourseOpeningConditionEnum.Always,
    enum: CourseOpeningConditionEnum,
  })
  type_learn: number;

  @ApiPropertyOptional({ description: 'Các khóa học cần hoàn thành' })
  @IsOptional()
  @ValidateIf((o) => o.type_learn === CourseOpeningConditionEnum.OpenPrevious)
  @Transform(ObjectIdArrayTransform)
  @Prop({ type: [{ type: Types.ObjectId }] })
  @IsArray()
  complete_courses?: Types.ObjectId[];

  @ApiPropertyOptional({
    description: 'Phần trăm hoàn thành và cấp chứng chỉ (nếu có) khóa học',
    default: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  @Prop({ type: Number, required: false, default: 100 })
  percent_complete: number;

  @ApiPropertyOptional({
    description: 'Tổng số chương',
    default: 0,
  })
  @Prop({ required: false, type: Number, default: 0 })
  total_chapter: number;

  @ApiPropertyOptional({
    description: 'Tổng số bài học',
    default: 0,
  })
  @Prop({ required: false, type: Number, default: 0 })
  total_lesson: number;

  @ApiPropertyOptional({ description: 'Bật/Tắt thảo luận' })
  @IsOptional()
  @Prop({ required: false, type: Boolean })
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  can_comment: boolean;

  @ApiPropertyOptional({ description: 'Slug' })
  @IsString()
  @Prop({
    unique: true,
    sparse: true,
  })
  slug: string;

  @ApiPropertyOptional({ description: 'Mã khóa học' })
  @IsOptional()
  @IsString()
  @Prop({
    unique: true,
    sparse: true,
  })
  code?: string;

  @ApiPropertyOptional({ description: 'Giá gốc' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Prop({ type: Number, default: 0, min: 0 })
  price: number;

  @ApiPropertyOptional({ description: 'Giá bán' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Prop({ type: Number, default: 0, min: 0 })
  price_sell: number;

  @ApiPropertyOptional()
  @Prop({ type: Date })
  deleted_at?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => SEO)
  @Prop({ type: SEO })
  seo?: SEO;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'Kết quả đầu ra phải có ít nhất một phần tử' })
  @IsString({ each: true })
  @IsNotEmpty({ each: true, message: 'Mỗi kết quả đầu ra không được để trống' })
  @Prop({ type: [String] })
  outcomes?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'Phải có ít nhất một đối tượng học viên' })
  @ValidateNested({ each: true })
  @Type(() => Audience)
  @Prop({ type: [Audience] })
  audiences?: Audience[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'Phải có ít nhất một câu hỏi thường gặp' })
  @ValidateNested({ each: true })
  @Type(() => Faq)
  @Prop({ type: [Faq] })
  faqs?: Faq[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'Phải có ít nhất một sản phẩm mẫu' })
  @ValidateNested({ each: true })
  @Type(() => CaseStudy)
  @Prop({ type: [CaseStudy] })
  case_studies: CaseStudy[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'Phải có ít nhất một sự kiện' })
  @ValidateNested({ each: true })
  @Type(() => Event)
  @Prop({ type: [Event] })
  events: Event[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'Phải có ít nhất một giảng viên' })
  @ValidateNested({ each: true })
  @Type(() => Instructor)
  @Prop({ type: [Instructor] })
  instructors?: Instructor[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'Phải có ít nhất một lớp học' })
  @ValidateNested({ each: true })
  @Type(() => CourseCohort)
  @Prop({ type: [CourseCohort] })
  cohorts: CourseCohort[];

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Ngày chia sẻ không hợp lệ' })
  @Prop({ type: Date })
  shared_at?: Date;

  @Prop()
  zoom_password?: string;

  @Prop({ type: String })
  zoom_meeting_id?: string | number;

  @Prop({ exam: 'https://zoom.us/j/YOUR_MEETING_ID' })
  zoom_join_url?: string;

  @Prop({ exam: 'https://zoom.us/s/YOUR_MEETING_ID?zak=xxx' })
  zoom_start_url?: string;

  getUpcomingSchedules: (count?: number) => Date[];
  owner?: UserDocument;

  constructor(price: number, price_sell: number) {
    this.price = price;
    this.setPriceSell(price_sell);
  }

  setPriceSell(value: number) {
    if (value > this.price) {
      throw new Error('Giá bán không thể lớn hơn giá gốc khóa học');
    }
    this.price_sell = value;
  }
}

export const CourseSchema = SchemaFactory.createForClass(Course);

CourseSchema.virtual('owner', {
  ref: 'Teacher',
  localField: 'owner_id',
  foreignField: 'user_id',
  justOne: true,
});

CourseSchema.virtual('total_students', {
  ref: 'UserCourse',
  localField: '_id',
  foreignField: 'course_id',
  count: true,
});
CourseSchema.virtual('instructor_users', {
  ref: 'User',
  localField: 'instructors.username',
  foreignField: 'username',
  justOne: false,
});
CourseSchema.methods = {
  getUpcomingSchedules: function (count = 1) {
    const schedules: Date[] = [];

    for (const cohort of this.cohorts || []) {
      const startDate = new Date(cohort.start_date);
      const endDate = cohort.end_date ? new Date(cohort.end_date) : undefined;

      for (const recurrence of cohort.recurrences || []) {
        const byweekday = (recurrence.frequency || [])
          .map((day: string) => weekdayMap[day])
          .filter(Boolean);

        const [hours, minutes] = recurrence.start_time.split(':').map(Number);

        const dtstart = new Date(startDate);
        dtstart.setHours(hours);
        dtstart.setMinutes(minutes);
        dtstart.setSeconds(0);
        dtstart.setMilliseconds(0);

        const rule = new RRule({
          freq: RRule.WEEKLY,
          interval: 1,
          byweekday,
          dtstart,
          // count,
          until: endDate,
        });

        const now = new Date();
        const futureSchedules = rule.between(
          now,
          endDate || dayjs().add(1, 'month').toDate(),
          true,
        );

        schedules.push(...futureSchedules.slice(0, count));
      }
    }

    return schedules
      .filter((d) => d > new Date())
      .sort((a, b) => a.getTime() - b.getTime());
  },
};

CourseSchema.index({ title: 'text', introduce: 'text' });
