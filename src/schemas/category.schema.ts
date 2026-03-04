import { HydratedDocument, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type CategoryDocument = HydratedDocument<Category>;

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
  collection: 'categories',
})
export class Category {
  @ApiProperty({ description: 'Tên danh mục' })
  @Prop({ type: String, required: true })
  name: string;

  @ApiPropertyOptional({ description: 'Mô tả' })
  @Prop({ type: String })
  description?: string;

  @ApiProperty({ description: 'Slug danh mục' })
  @Prop({ type: String, unique: true, sparse: true })
  slug: string;

  @ApiPropertyOptional({ description: 'Thứ tự danh mục' })
  @Prop({ type: Number, default: 0 })
  order?: number;

  @ApiPropertyOptional({ description: 'Danh mục cha' })
  @Prop({ type: Types.ObjectId })
  parent_id?: Types.ObjectId;

  created_at?: Date;
  updated_at?: Date;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
