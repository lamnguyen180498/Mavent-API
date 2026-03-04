import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { HydratedDocument, Types } from 'mongoose';
import { Transform } from 'class-transformer';
import { Course, CourseDocument } from './course.schema';

export type CartDocument = HydratedDocument<Cart>;

@Schema({
  collection: 'carts',
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  strict: 'throw',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Cart {
  @ApiProperty({
    type: String,
    description: 'Id người dùng',
  })
  @Prop({ type: Types.ObjectId })
  @IsNotEmpty()
  @Transform(({ value }) =>
    Types.ObjectId.isValid(value)
      ? Types.ObjectId.createFromHexString(value)
      : undefined,
  )
  user_id: Types.ObjectId;

  @ApiProperty({
    type: String,
    description: 'Id sản phẩm',
  })
  @Prop({ type: Types.ObjectId })
  @IsOptional()
  @Transform(({ value }) =>
    Types.ObjectId.isValid(value)
      ? Types.ObjectId.createFromHexString(value)
      : undefined,
  )
  course_id?: Types.ObjectId;

  @ApiProperty({ type: Number, description: 'Số lượng' })
  @IsNumber()
  @IsOptional()
  @Prop({ default: 1, min: 0 })
  quantity?: number;

  course?: CourseDocument;
}

export const CartSchema = SchemaFactory.createForClass(Cart);

CartSchema.virtual('course', {
  ref: Course.name,
  localField: 'course_id',
  foreignField: '_id',
  justOne: true,
});
