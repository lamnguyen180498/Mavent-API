import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsNumber,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ObjectIdTransform } from '../common/transforms/objectid.transform';
import { User, UserDocument, UserSchema } from './user.schema';

export type ReviewDocument = HydratedDocument<Review>;

@Schema({
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    },
    strict: 'throw',
    collection: 'reviews',
})
export class Review {
    @ApiProperty({ type: String, description: 'Người đánh giá' })
    @Prop({ type: Types.ObjectId, required: true })
    user_id: Types.ObjectId;

    @ApiProperty({ type: String, description: 'Khóa học được đánh giá' })
    @Prop({ type: Types.ObjectId, required: true })
    @Transform(ObjectIdTransform)
    course_id: Types.ObjectId;

    @ApiProperty({ description: 'Số sao đánh giá (1-5)', minimum: 1, maximum: 5 })
    @Prop({ type: Number, required: true, min: 1, max: 5 })
    @IsNumber()
    @Min(1, { message: 'Số sao tối thiểu là 1' })
    @Max(5, { message: 'Số sao tối đa là 5' })
    @Type(() => Number)
    rating: number;

    @ApiPropertyOptional({ description: 'Nội dung đánh giá' })
    @Prop({ type: String })
    @IsOptional()
    @IsString()
    content?: string;

    @ApiPropertyOptional({ description: 'Trạng thái (1: hiển thị, 0: ẩn)' })
    @Prop({ type: Number, default: 1 })
    status: number;

    user?:UserDocument
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
// Index for faster queries
ReviewSchema.index({ course_id: 1, created_at: -1 });
ReviewSchema.index({ user_id: 1, course_id: 1 }, { unique: true }); // One review per user per course

ReviewSchema.virtual('user', {
  ref: User.name,
  localField: 'user_id',
  foreignField: '_id',
  justOne: true,
});