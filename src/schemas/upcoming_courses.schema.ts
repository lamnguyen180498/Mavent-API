import { HydratedDocument, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Course } from './course.schema';

export type UpcomingCoursesDocument = HydratedDocument<UpcomingCourses>;

@Schema({
  timestamps: false,
  strict: 'throw',
  toJSON: {
    virtuals: true,
  },
  toObject: {
    virtuals: true,
  },
  collection: 'upcoming_courses',
})
export class UpcomingCourses {
  @Prop({ type: Types.ObjectId })
  course_id: Types.ObjectId;

  @Prop({ type: Date })
  recurrence_datetime: Date;
}

export const UpcomingCoursesSchema =
  SchemaFactory.createForClass(UpcomingCourses);

UpcomingCoursesSchema.virtual('course', {
  ref: Course.name,
  localField: 'course_id',
  foreignField: '_id',
  justOne: true,
});
