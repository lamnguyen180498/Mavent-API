import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { User, UserDocument } from './user.schema';

import { Course, CourseDocument } from './course.schema';
import { Transform } from 'class-transformer';
import { ObjectIdTransform } from '../common/transforms/objectid.transform';

export type CommentDocument = HydratedDocument<Comment>;

export enum ECommentType {
  Course = 'course',
}

@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  strict: 'throw',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Comment {
  @ApiProperty()
  @Prop({
    type: Types.ObjectId,
  })
  @IsOptional()
  @Transform(ObjectIdTransform)
  user_id: Types.ObjectId;

  @ApiPropertyOptional()
  @Prop({
    type: Types.ObjectId,
  })
  @IsOptional()
  @Transform(ObjectIdTransform)
  course_id?: Types.ObjectId;

  @ApiPropertyOptional()
  @Prop({
    type: Types.ObjectId,
  })
  @IsOptional()
  @Transform(ObjectIdTransform)
  comment_id?: Types.ObjectId;

  @ApiProperty({ type: String })
  @Prop({ type: String })
  content: string;

  @ApiProperty()
  @Prop({ enum: ECommentType, default: ECommentType.Course })
  type: ECommentType;

  post: CourseDocument;
  user: UserDocument;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
CommentSchema.virtual('user', {
  ref: User.name,
  localField: 'user_id',
  foreignField: '_id',
  justOne: true,
});

CommentSchema.virtual('course', {
  ref: Course.name,
  localField: 'course_id',
  foreignField: '_id',
  justOne: true,
  match: { deleted_at: null },
});
