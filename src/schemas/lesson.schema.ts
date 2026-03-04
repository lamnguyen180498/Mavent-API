import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HydratedDocument, Types } from 'mongoose';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ObjectIdTransform } from '../common/transforms/objectid.transform';

export type LessonDocument = HydratedDocument<Lesson>;

export const LessonLevel = {
  Beginner: 0,
  Intermediate: 1,
  Advanced: 2,
} as const;

export const LessonMaterialType = {
  Video: 'video',
  Document: 'document',
  Stream: 'stream',
  Quiz: 'quiz',
  Exam: 'exam',
  Survey: 'survey',
  Text: 'text',
};

export const LessonStatus = {
  Draft: 'draft',
  Published: 'published',
  Archived: 'archived',
};

export class LessonMaterial {
  @ApiProperty({ enum: LessonMaterialType })
  @IsEnum(LessonMaterialType)
  @Prop({ type: LessonMaterialType })
  type: (typeof LessonMaterialType)[keyof typeof LessonMaterialType];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Prop()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Prop()
  @IsUrl({}, { message: 'Vui lòng nhập url hợp lệ' })
  url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Prop()
  thumbnail_url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Prop()
  video_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Prop()
  ext?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Prop()
  duration?: number;

  // START setting zoom
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Prop()
  zoom_password: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Prop()
  zoom_meeting_id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Prop({ exam: 'https://zoom.us/j/YOUR_MEETING_ID' })
  zoom_join_url: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Prop({ exam: 'https://zoom.us/s/YOUR_MEETING_ID?zak=xxx' })
  zoom_start_url: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Prop({ description: 'ID người tổ chức (zoom user id)' })
  zoom_host_id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @Prop()
  zoom_start_time: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Prop()
  zoom_timezone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Prop({ description: 'Có phải là cuộc họp định kỳ hay không' })
  zoom_recurring?: boolean;

  // END setting zoom
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
export class Lesson {
  @ApiProperty()
  @IsString()
  @Prop()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Prop()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Prop()
  content?: string;

  @ApiProperty({ enum: LessonLevel })
  @IsEnum(LessonLevel)
  @Prop({ enum: LessonLevel, type: Number })
  level: (typeof LessonLevel)[keyof typeof LessonLevel];

  @ApiProperty()
  @IsNotEmpty()
  @Transform(({ value }) =>
    Types.ObjectId.isValid(value)
      ? Types.ObjectId.createFromHexString(value)
      : undefined,
  )
  @Prop()
  course_id: Types.ObjectId;

  @ApiPropertyOptional()
  @Prop({
    type: Types.ObjectId,
  })
  @IsOptional()
  @Transform(ObjectIdTransform)
  quiz_id?: Types.ObjectId;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) =>
    Types.ObjectId.isValid(value)
      ? Types.ObjectId.createFromHexString(value)
      : undefined,
  )
  @Prop()
  parent_id?: Types.ObjectId;

  @ApiProperty()
  @Transform(({ value }) =>
    Types.ObjectId.isValid(value)
      ? Types.ObjectId.createFromHexString(value)
      : undefined,
  )
  @Prop()
  author_id: Types.ObjectId;

  @ApiProperty()
  @ValidateNested()
  @Type(() => LessonMaterial)
  @Prop({ type: LessonMaterial })
  material: LessonMaterial;

  @ApiProperty({ enum: LessonStatus })
  @IsEnum(LessonStatus)
  @Prop({ enum: LessonStatus, type: String })
  status: (typeof LessonStatus)[keyof typeof LessonStatus];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Prop({ default: 0 })
  views?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Prop({ default: 0 })
  feedback?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Prop({ default: 0 })
  likes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Prop()
  order?: number;

  @ApiPropertyOptional({
    description: 'Tổng số bài học trong chương',
    default: 0,
  })
  @Prop({ required: false, type: Number, default: 0 })
  total_lesson?: number;

  @ApiPropertyOptional({
    description: 'Có cho phép học thử hay ko?',
  })
  @Prop()
  @IsOptional()
  @IsBoolean()
  is_trial?: boolean;
}

export const LessonSchema = SchemaFactory.createForClass(Lesson);
