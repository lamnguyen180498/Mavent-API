import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { Types } from 'mongoose';
import { ObjectIdArrayTransform } from 'src/common/transforms/object-id-array.transform';

export class getLearingProgressDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(ObjectIdArrayTransform)
  course_ids?: Types.ObjectId[];
}
