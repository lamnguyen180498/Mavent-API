import { HydratedDocument, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ObjectIdArrayTransform } from 'src/common/transforms/object-id-array.transform';
import { BooleanTransform } from 'src/common/transforms/boolean.transform';
import { Tag } from './tag.schema';
import { User } from './user.schema';

export type QuizTestDocument = HydratedDocument<QuizTest>;

export enum QuizTestStatusEnum {
  Private = 0,
  Public = 1,
}

export enum QuizTestTypeEnum {
  Test = 'test',
  Lesson = 'lesson',
  Special = 'special',
}

export enum QuizTestShowResultEnum {
  NoDisplay = 0, // Không hiện đáp án
  DisplayOnPass = 1, // Khi qua điểm đạt
  DisplayOnFail = 2, // Khi không qua điểm đạt
  Display = 3, // Luôn hiện đáp án
}

export enum QuizTestShowNoteEnum {
  NoDisplay = 0, // Không hiển thị
  Display = 1, // Đặt dưới câu hỏi
  ViewingAnswer = 2, // Khi xem đáp án
}

export enum QuizTestViewSequenceEnum {
  One = 'one',
  All = 'all',
}

export enum QuizTestOptionSelectQuizEnum {
  RandomList = 2, //Lấy ngẫu nhiên trong danh sách chọn
  Random = 1, //Lấy ngẫu nhiên trong ngân hàng câu hỏi
  Select = 0, //Nhập trước danh sách câu hỏi vào đề thi
}

export class ListRandomQuiz {
  @ApiProperty({ type: [String], description: 'Danh sách ID tag' })
  @IsNotEmpty({ message: 'Trường tag_ids là bắt buộc' })
  @ArrayMinSize(1, { message: 'Danh sách ID tag không được để trống' })
  @IsArray()
  @Transform(ObjectIdArrayTransform)
  tags: Types.ObjectId[];

  @ApiProperty({ type: Number, description: 'Số lượng câu hỏi lấy ra' })
  @IsNotEmpty({ message: 'Số lượng câu hỏi không được để trống' })
  @IsNumber()
  number: number;
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
  collection: 'quiz_tests',
})
export class QuizTest {
  @ApiProperty({ type: String, description: 'Tiêu đề bài kiểm tra' })
  @IsNotEmpty({ message: 'Tiêu đề bài kiểm tra không được để trống' })
  @Prop({
    type: String,
    required: true,
  })
  title: string;

  @ApiProperty({
    type: String,
    description: 'Mô tả bài kiểm tra',
  })
  @IsNotEmpty({ message: 'Mô tả bài kiểm tra không được để trống' })
  @Prop({
    type: String,
    required: true,
  })
  description: string;

  @ApiProperty({
    type: String,
    description: 'Thời gian làm bài (Phút)',
  })
  @IsNotEmpty({ message: 'Thời gian làm bài không được để trống' })
  @Prop()
  time: number;

  @ApiProperty({
    type: String,
    description: 'Giới hạn số lần làm',
  })
 @IsOptional()
  @Prop()
  limit?: number;

  @ApiProperty({
    type: String,
    description: 'Điểm mỗi câu hỏi',
  })
  @IsNotEmpty({ message: 'Điểm mỗi câu hỏi không được để trống' })
  @Prop({
    type: Number,
    required: true,
  })
  point: number;

  @ApiProperty({
    type: Number,
    description: 'Điểm hoàn thành bài kiểm tra',
  })
  @IsNotEmpty({ message: 'Điểm hoàn thành bài kiểm tra không được để trống' })
  @Prop({
    type: Number,
    required: true,
  })
  percent_complete: number;

  @Prop({ type: Types.ObjectId, required: true })
  creator_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  updater_id: Types.ObjectId;

  @ApiPropertyOptional({
    type: String,
    description: 'Danh sách ID câu hỏi (option_select_quiz = 1)',
  })
  @IsOptional()
  @IsArray()
  @Transform(ObjectIdArrayTransform)
  @Prop({ type: [Types.ObjectId] })
  quiz_ids?: Types.ObjectId[]

  @ApiPropertyOptional({
    type: String,
    description: 'Tổng ID câu hỏi',
  })
  @IsOptional()
  @Prop({ type: Number, default: 0 })
  total_quiz: number;

  @ApiPropertyOptional({
    type: Number,
    enum: QuizTestStatusEnum,
    description: 'Trạng thái bài kiểm tra',
  })
  @Transform(({ value }) => parseInt(value))
  @IsEnum(QuizTestStatusEnum)
  @Prop({
    type: Number,
    enum: QuizTestStatusEnum,
    default: QuizTestStatusEnum.Public,
  })
  status: QuizTestStatusEnum;

  @ApiPropertyOptional({
    type: String,
    description: 'Nội dung hiển thị khi bài kiểm tra hoàn thành',
  })
  @IsOptional()
  @Prop({ type: String, default: '' })
  content_pass: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Nội dung hiển thị khi bài kiểm tra không hoàn thành',
  })
  @IsOptional()
  @Prop({ type: String, default: '' })
  content_fail: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'ID tag',
  })
  @IsOptional()
  @Transform(ObjectIdArrayTransform)
  @Prop({ type: [Types.ObjectId], default: [] })
  tag_ids: [Types.ObjectId];

  @ApiPropertyOptional({
    type: String,
    description: 'Ảnh thumbnail cho bài kiểm tra',
  })
  @IsOptional()
  @Prop({ type: String })
  thumbnail?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Đặt lịch mở bài kiểm tra',
  })
  @IsOptional()
  @Prop({ type: Boolean, default: false })
  set_time_learn?: boolean;

  @ApiPropertyOptional({
    type: Number,
    enum: QuizTestShowResultEnum,
    description: 'Chế độ xem đáp án sau khi thi',
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsEnum(QuizTestShowResultEnum)
  @Prop({
    type: Number,
    enum: QuizTestShowResultEnum,
    default: QuizTestShowResultEnum.NoDisplay,
  })
  show_result: QuizTestShowResultEnum;

  @ApiPropertyOptional({
    type: Number,
    enum: QuizTestShowNoteEnum,
    description: 'Hiển thị đáp án ',
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsEnum(QuizTestShowNoteEnum)
  @Prop({
    type: Number,
    enum: QuizTestShowNoteEnum,
    default: QuizTestShowNoteEnum.NoDisplay,
  })
  show_note: QuizTestShowNoteEnum;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Cho phép làm lại bài kiểm tra',
  })
  @IsOptional()
  @Prop({
    type: Boolean,
    default: false,
  })
  @Transform(BooleanTransform)
  remake_quiz: boolean;

  @ApiPropertyOptional({
    type: Number,
    description: 'Số lần làm lại bài kiểm tra',
  })
  @IsOptional()
  @IsNumber()
  @Prop({
    type: Number,
    default: 0,
  })
  number_of_fail: number;

  @ApiPropertyOptional({
    type: String,
    description: 'Thời gian đóng đề',
    example: '2025-05-25T10:30:00Z',
  })
  @IsOptional()
  @IsDateString()
  @Prop({ default: null })
  end_time: Date;

  @ApiPropertyOptional({
    type: String,
    description: 'Thời gian bắt đầu mở đề',
    example: '2025-05-24T10:30:00Z',
  })
  @IsOptional()
  @IsDateString()
  @Prop({ default: null })
  start_time: Date;

  @ApiPropertyOptional({ description: 'Mã code truy cập vào đề thi' })
  @IsOptional()
  @Prop()
  code: string;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Hiển thị câu hỏi ngẫu nhiên',
  })
  @IsOptional()
  @Transform(BooleanTransform)
  @Prop({ type: Boolean, default: false })
  random_question: boolean;

  @ApiPropertyOptional({
    type: String,
    enum: QuizTestViewSequenceEnum,
    description: 'Giao diện làm bài',
  })
  @IsOptional()
  @IsEnum(QuizTestViewSequenceEnum)
  @Prop({
    type: String,
    enum: QuizTestViewSequenceEnum,
    default: QuizTestViewSequenceEnum.All,
  })
  view_sequence: QuizTestViewSequenceEnum;

  @ApiPropertyOptional({
    type: Number,
    enum: QuizTestOptionSelectQuizEnum,
    description: 'Kiểu lấy câu hỏi vào đề thi',
  })
  @IsOptional()
  @IsEnum(QuizTestOptionSelectQuizEnum)
  @Prop({ type: Number, default: QuizTestOptionSelectQuizEnum.Select })
  option_select_quiz?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Số lượng câu hỏi ngẫu nhiên (option_select_quiz = 1)',
  })
  @Prop({ type: Number, default: 1 })
  number_quiz_random?: number;

  @ApiPropertyOptional({
    type: [String],
    description: 'ID tag random (option_select_quiz = 1)',
  })
  @IsOptional()
  @Transform(ObjectIdArrayTransform)
  @Prop({ type: [Types.ObjectId] })
  tag_random_ids?: [Types.ObjectId];

  @IsOptional()
  @Prop({ type: Array, default: undefined })
  list_random?: ListRandomQuiz[];

  @Prop({ type: Date, default: null })
  deleted_at?: Date;

  @ApiProperty({ description: 'Id đồng bộ ' })
  @Prop()
  code_sync?: number;

  @ApiProperty({ description: 'Đánh dấu quiz test đồng bộ' })
  @Prop()
  sync?: number;
}

export const QuizTestSchema = SchemaFactory.createForClass(QuizTest);

QuizTestSchema.virtual('creator', {
  ref: User.name,
  localField: 'creator_id',
  foreignField: '_id',
  justOne: true,
});

QuizTestSchema.virtual('tags', {
  ref: Tag.name,
  localField: 'tag_ids',
  foreignField: '_id',
  justOne: false,
});
