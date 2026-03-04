import { Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsArray, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ObjectIdTransform } from 'src/common/transforms/objectid.transform';
import { ObjectIdArrayTransform } from '../common/transforms/object-id-array.transform';
import { Tag } from './tag.schema';

export enum EQuizType {
  TrueFalse = 'quiz_true_false', // câu hỏi đúng sai
  OneChoice = 'quiz_one_choice', // câu hỏi 1 lựa chọn
  MultipleChoice = 'quiz_multiple_choice', // câu hỏi nhiều lựa chọn
  DragDropWord = 'quiz_drag_drop_word', // câu hỏi kéo thả từ
  Matching = 'quiz_matching', // câu hỏi ghép đôi
}

export interface QuizAnswerInterface {
  id: string;
  text?: string;
}

export class QuizAnswer implements QuizAnswerInterface {
  @ApiProperty({ type: String, description: 'Id câu trả lời (UID)' })
  @IsNotEmpty()
  @Prop({ required: true, type: String })
  id: string;

  @ApiProperty({ type: String, description: 'Nội dung câu trả lời.' })
  @IsNotEmpty()
  @Prop({ required: false, type: String, default: '' })
  text?: string;
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
  collection: 'quizs',
})
export class Quiz {
  @ApiProperty({ description: 'Loại câu hỏi' })
  @IsNotEmpty()
  @Prop({ required: true, enum: EQuizType })
  type: EQuizType;

  @ApiProperty({ description: 'Câu hỏi' })
  @IsNotEmpty()
  @Prop({ required: true })
  content: string;

  @ApiPropertyOptional({
    description: 'Danh sách câu trả lời',
    type: () => QuizAnswer,
    isArray: true,
  })
  @IsArray()
  @IsOptional()
  @Prop()
  answers?: QuizAnswerInterface[] | QuizAnswerInterface[][];

  @ApiPropertyOptional({ description: 'Đáp án đúng' })
  @IsArray()
  @IsOptional()
  @Prop({ required: true, type: [] })
  corrects?: string[] | string[][] | Record<string, any>[];

  @ApiPropertyOptional({ description: 'Giải thích đáp án' })
  @IsOptional()
  @Prop()
  note?: string;

  @ApiProperty({ description: 'ID người tạo' })
  @IsNotEmpty()
  @Transform(ObjectIdTransform)
  @Prop({ type: Types.ObjectId, required: true })
  creator_id: Types.ObjectId;

  @ApiProperty({ description: 'ID người cập nhật' })
  @IsNotEmpty()
  @Transform(ObjectIdTransform)
  @Prop({ type: Types.ObjectId })
  updater_id?: Types.ObjectId;

  @ApiProperty({ type: Date, description: 'Ngày xóa' })
  @Prop()
  deleted_at?: Date;

  @ApiProperty({ type: String, description: 'Người xóa' })
  @Prop({ type: Types.ObjectId })
  user_deleted_at?: Types.ObjectId;

  @ApiProperty({ description: 'ID tags' })
  @IsOptional()
  @IsArray()
  @Transform(ObjectIdArrayTransform)
  @Prop({ type: [Types.ObjectId], required: false, default: undefined })
  tag_ids?: Types.ObjectId[];
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);
QuizSchema.virtual('tags', {
  ref: Tag.name,
  localField: 'tag_ids',
  foreignField: '_id',
  justOne: false,
});