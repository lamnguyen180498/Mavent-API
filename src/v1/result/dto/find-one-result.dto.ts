import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { ObjectIdTransform } from '../../../common/transforms/objectid.transform';
import { Types } from 'mongoose';

export class FindOneResult {
  @ApiPropertyOptional({
    type: String,
    description: 'Id Bài kiểm tra',
  })
  @IsOptional()
  @Transform(ObjectIdTransform)
  test_id?: Types.ObjectId;

  @ApiPropertyOptional({
    type: String,
    description: 'Id Bài học',
  })
  @IsOptional()
  @Transform(ObjectIdTransform)
  lesson_id?: Types.ObjectId;
}
