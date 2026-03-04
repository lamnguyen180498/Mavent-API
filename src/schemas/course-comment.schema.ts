import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type CourseCommentDocument = HydratedDocument<CourseComment>;

@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  strict: 'throw',
  collection: 'course_comments',
})
export class CourseComment {
  @ApiProperty({ type: String, description: 'Người đăng' })
  @Prop({ type: Types.ObjectId })
  creator_id?: Types.ObjectId;

  @ApiProperty({ type: String })
  @Prop({ type: Types.ObjectId })
  parent_id: Types.ObjectId;

  @ApiProperty()
  @Prop()
  content: string;

  @ApiPropertyOptional()
  @Prop()
  title?: string;

  @ApiPropertyOptional({ description: 'Ảnh đính kèm' })
  @Prop()
  image?: string;

  @ApiProperty()
  @Prop()
  status: number;

  @ApiProperty()
  @Prop()
  approval_status: number;

  @ApiProperty({
    type: String,
  })
  @Prop({ type: Types.ObjectId })
  course_id?: Types.ObjectId;
}

export const CourseCommentSchema = SchemaFactory.createForClass(CourseComment);
