import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsNumber } from 'class-validator';
import { CourseDocument } from './course.schema';
import { UserDocument } from './user.schema';
import { Transform } from 'class-transformer';
import { BooleanTransform } from '../common/transforms/boolean.transform';

export type UserCourseDocument = HydratedDocument<UserCourse>;

export enum EUserCourseSrc {
  Teacher = 1,
  Buy = 2,
}

@Schema({
  collection: 'user_courses',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  strict: 'throw',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class UserCourse {
  @ApiProperty()
  @Prop({ type: Types.ObjectId })
  @IsMongoId()
  user_id: Types.ObjectId;

  @ApiProperty()
  @Prop({ type: Types.ObjectId })
  @IsMongoId()
  course_id: Types.ObjectId;

  @ApiPropertyOptional()
  @Prop({ enum: EUserCourseSrc })
  @IsNumber()
  src?: EUserCourseSrc;

  @ApiPropertyOptional()
  @Prop({ type: String })
  note?: string;

  @ApiPropertyOptional()
  @Prop({ type: String })
  cohort_code?: string;

  @ApiPropertyOptional({ type: [String] })
  @Prop({ type: [Types.ObjectId] })
  @IsMongoId({ each: true })
  completed_lessons?: Types.ObjectId[];

  @ApiPropertyOptional({
    type: Date,
    description: 'Thời gian hết hạn khóa học',
    default: null,
  })
  @Prop({ type: Date })
  expired_at?: Date;

  @ApiProperty()
  @Transform(BooleanTransform)
  @Prop({ type: Boolean, default: false })
  paid: boolean;

  @ApiProperty()
  @Transform(BooleanTransform)
  @Prop({ type: Boolean })
  free: boolean;

  @ApiProperty({ description: 'Thời gian xóa' })
  @Prop()
  deleted_at: Date;

  course?: CourseDocument;
  user?: UserDocument;
}

export const UserCourseSchema = SchemaFactory.createForClass(UserCourse);

UserCourseSchema.virtual('course', {
  ref: 'Course',
  localField: 'course_id',
  foreignField: '_id',
  justOne: true,
});
UserCourseSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true,
});
