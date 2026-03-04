import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type TagQuizDocument = HydratedDocument<TagQuiz>;

export enum ETagQuizStatus {
  Active = 1,
  Deleted = 0,
}

@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  strict: 'throw',
  collection: 'tags_quiz',
})
export class TagQuiz {
  @ApiProperty()
  @Prop()
  name: string;

  @ApiProperty()
  @Prop()
  slugs: string;

  @ApiProperty()
  @Prop({ type: Types.ObjectId })
  sid: Types.ObjectId;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'User' })
  creator: Types.ObjectId;

  @ApiProperty()
  @Prop({ enum: ETagQuizStatus })
  status: ETagQuizStatus;

  @ApiProperty()
  @Prop()
  description: string;

  @ApiPropertyOptional({ description: 'Số lượng quiz', type: Number })
  @Prop({ type: Number })
  total_quiz?: number;

  @ApiPropertyOptional({ description: 'Số lượng course', type: Number })
  @Prop({ type: Number })
  total_course?: number;

  @ApiPropertyOptional({ description: 'Số lượng combo', type: Number })
  @Prop({ type: Number })
  total_combo?: number;

  updated_at: Date;
  deleted_at?: Date;
}

export const TagQuizSchema = SchemaFactory.createForClass(TagQuiz);
