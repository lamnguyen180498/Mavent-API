import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { HydratedDocument, Types } from 'mongoose';
import { Transform, Type } from 'class-transformer';
import { ObjectIdTransform } from 'src/common/transforms/objectid.transform';
import { ObjectIdArrayTransform } from 'src/common/transforms/object-id-array.transform';
import { SEO } from 'src/common/seo';
import { BooleanTransform } from 'src/common/transforms/boolean.transform';

export enum BlogStatusEnum {
  Private = 0, // riêng tư
  Public = 1, // mở bán
}

export type BlogDocument = HydratedDocument<Blog>;

@Schema({
  collection: 'blogs',
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  strict: 'throw',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Blog {
  @ApiPropertyOptional({ description: 'Chủ sở hữu' })
  @Prop({
    type: Types.ObjectId,
  })
  @Transform(ObjectIdTransform)
  owner_id: Types.ObjectId;

  @ApiProperty({ enum: BlogStatusEnum, default: BlogStatusEnum.Private })
  @IsNotEmpty()
  @Prop({
    required: true,
    default: BlogStatusEnum.Private,
    enum: BlogStatusEnum,
  })
  @IsEnum(BlogStatusEnum)
  @Type(() => Number)
  status: BlogStatusEnum;

  @ApiProperty({ type: String, description: 'Tiêu đề' })
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @IsString()
  @Prop({ required: true })
  title: string;

  @ApiProperty({ type: String, description: 'Mô tả' })
  @IsNotEmpty({ message: 'Mô tả không được để trống' })
  @IsString()
  @Prop({ required: true })
  description: string;

  @ApiProperty({ description: 'Nội dung' })
  @IsNotEmpty({ message: 'Nội dung không được để trống' })
  @Prop({ required: true })
  content: string;

  @ApiProperty({ description: 'Danh mục' })
  @IsNotEmpty({ message: 'Danh mục không được để trống' })
  @Prop({ type: Types.ObjectId })
  @Transform(ObjectIdTransform)
  category_id: Types.ObjectId;

  @ApiPropertyOptional({ description: 'Các khóa học liên quan' })
  @IsOptional()
  @Prop({
    required: false,
    type: [Types.ObjectId],
  })
  @Transform(ObjectIdArrayTransform)
  course_ids?: Types.ObjectId[];

  @ApiPropertyOptional({ description: 'Hình đại diện' })
  @Prop({ required: false })
  thumbnail?: string;

  @ApiPropertyOptional({ description: 'Slug' })
  @Prop({
    unique: true,
    sparse: true,
  })
  slug: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => SEO)
  @Prop({ type: SEO })
  seo?: SEO;

  @ApiProperty({ description: 'Nổi bật' })
  @IsOptional()
  @Transform(BooleanTransform)
  @Prop({ default: false })
  is_featured: boolean;

  @ApiProperty({ description: 'Lượt xem' })
  @IsOptional()
  @Prop({ default: 0 })
  @Type(() => Number)
  views: number;
}

export const BlogSchema = SchemaFactory.createForClass(Blog);

BlogSchema.virtual('owner', {
  ref: 'User',
  localField: 'owner_id',
  foreignField: '_id',
  justOne: true,
});

BlogSchema.virtual('category', {
  ref: 'Category',
  localField: 'category_id',
  foreignField: '_id',
  justOne: true,
});

BlogSchema.virtual('courses', {
  ref: 'Course',
  localField: 'course_ids',
  foreignField: '_id',
});
