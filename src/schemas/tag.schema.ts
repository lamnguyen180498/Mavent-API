import { HydratedDocument, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export type TagDocument = HydratedDocument<Tag>;

@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  toJSON: {
    virtuals: true,
  },
  toObject: {
    virtuals: true,
  },
  collection: 'tags',
})
export class Tag {
  @ApiProperty({ description: 'Tiêu đề tag' })
  @Prop({ type: String, required: true })
  name: string;

  @ApiProperty({ description: 'Người tạo' })
  @Prop({ type: Types.ObjectId })
  @IsMongoId()
  user_id: Types.ObjectId;

  @ApiPropertyOptional({ description: 'Số lượng quiz', type: Number })
  @Prop({ type: Number })
  total_quiz?: number;

  created_at?: Date;
  updated_at?: Date;
}

export const TagSchema = SchemaFactory.createForClass(Tag);
