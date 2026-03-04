import { HydratedDocument, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type MapCompleteLessonDocument = HydratedDocument<MapCompleteLesson>;

export enum ECompleteLessonStatus {
  UnFinished = 0,
  Finished = 1,
}

@Schema({
  timestamps: {
    createdAt: true,
    updatedAt: false,
  },
  strict: 'throw',
  collection: 'map_complete_lessons',
})
export class MapCompleteLesson {
  @Prop({ type: Types.ObjectId })
  user_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  lesson_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  course_id: Types.ObjectId;

  @Prop({ enum: ECompleteLessonStatus })
  status: ECompleteLessonStatus;
}

export const MapCompleteLessonSchema =
  SchemaFactory.createForClass(MapCompleteLesson);
