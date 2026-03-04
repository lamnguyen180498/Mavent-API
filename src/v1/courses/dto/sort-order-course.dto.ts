import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Types } from 'mongoose';
import { ObjectIdTransform } from '../../../common/transforms/objectid.transform';

export class SortOrderCourseDto {
  @ApiProperty({ type: String, description: 'Id khóa học ' })
  @IsNotEmpty()
  @Transform(ObjectIdTransform)
  _id: Types.ObjectId;

  @ApiProperty({ type: Number, description: 'Thứ tự' })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  order: number;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @Transform(ObjectIdTransform)
  owner_id: Types.ObjectId;
}
