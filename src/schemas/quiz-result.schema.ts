import { HydratedDocument, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { User } from './user.schema';
import { QuizTest } from './quiz-test.schema';

export type QuizResultDocument = HydratedDocument<QuizResult>;

export enum EQuizResultStatus {
  Active = 1,
  Deleted = 0, // đã xóa
}

export enum EQuizTestStatusOrigin {
  NotGrading = 0,
  Failed = 1,
  Completed = 2,
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
  collection: 'quiz_result',
})
export class QuizResult {
  @ApiPropertyOptional({ description: 'ID của người thi' })
  @Prop({ type: Types.ObjectId, ref: 'User' })
  user_id: Types.ObjectId;

  @ApiPropertyOptional({ description: 'ID của đề thi' })
  @Prop({ type: Types.ObjectId, ref: 'QuizTest' })
  test_id: Types.ObjectId;

  @Prop({ enum: EQuizResultStatus, default: EQuizResultStatus.Active })
  status?: EQuizResultStatus;

  @Prop({ enum: Boolean })
  hide_result?: boolean;

  @ApiPropertyOptional({ description: 'Tên học viên' })
  @Prop({ type: String })
  user_full_name?: string;

  @ApiPropertyOptional({ description: 'Tổng điểm' })
  @Prop({ type: Number })
  total_score: number;

  @ApiPropertyOptional({ description: 'Điểm' })
  @Prop({ type: Number })
  score: number;

  @ApiPropertyOptional({ description: 'Số câu hỏi bỏ qua' })
  @Prop({ type: Number })
  skip: number;

  @ApiPropertyOptional({ description: 'Số câu hỏi làm sai' })
  @Prop({ type: Number })
  fail: number;

  @ApiPropertyOptional({ description: 'Số câu hỏi làm đúng' })
  @Prop({ type: Number })
  correct: number;

  @ApiPropertyOptional({ description: 'Thời gian hoàn thành' })
  @Prop({ type: Number })
  complete_time: number;

  @ApiPropertyOptional({ description: '% hoàn thành' })
  @Prop({ type: Number })
  percent_complete: number;

  @ApiPropertyOptional({ description: 'Số câu tự luận' })
  @Prop({ type: Number })
  total_quiz_phrase_statement: number;

  @ApiPropertyOptional({ description: 'Xác nhận đã chấm' })
  @Prop({ type: Boolean })
  check_phrase_statement?: boolean;

  @ApiPropertyOptional({ description: 'Điểm / 1 câu' })
  @Prop({ type: Number })
  quiz_point: number;

  @ApiPropertyOptional({ description: 'Danh sách ID câu hỏi làm đúng' })
  @Prop({ type: [Types.ObjectId], default: undefined })
  quiz_correct?: Types.ObjectId[];

  @ApiPropertyOptional()
  @Prop({ type: [String], default: undefined })
  quiz_ids?: string[];

  @ApiPropertyOptional({ description: 'Đáp án' })
  @Prop({ type: String })
  quiz_answer: string;

  @ApiPropertyOptional({ description: 'Tổng số câu' })
  @Prop({ type: Number })
  total_quiz: number;

  @ApiPropertyOptional()
  @Prop({ type: Object })
  all_scores?: object;

  @ApiPropertyOptional()
  @Prop({ type: Object })
  score_achieved?: object;

  @ApiPropertyOptional()
  @Prop({ type: Types.ObjectId, default: '' })
  lesson_id?: Types.ObjectId;

  @ApiPropertyOptional({ description: 'ID của khóa học' })
  @Prop({ type: Types.ObjectId, default: '' })
  course_id?: Types.ObjectId;

  // TODO: cần bổ sung các trường khác nếu lưu hoặc tạo mới
}

export const QuizResultSchema = SchemaFactory.createForClass(QuizResult);
QuizResultSchema.virtual('user', {
  ref: User.name,
  localField: 'user_id',
  foreignField: '_id',
  justOne: true,
});

QuizResultSchema.virtual('test', {
  ref: QuizTest.name,
  localField: 'test_id',
  foreignField: '_id',
  justOne: true,
});
