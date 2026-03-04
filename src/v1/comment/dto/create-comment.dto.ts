import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ObjectIdTransform } from '../../../common/transforms/objectid.transform';
import { Types } from 'mongoose';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'id khóa học không được để trống',
  })
  @IsNotEmpty()
  @Transform(ObjectIdTransform)
  course_id: Types.ObjectId;

  @ApiPropertyOptional({
    description: 'id comment cha',
    required: false,
  })
  @IsOptional()
  @Transform(ObjectIdTransform)
  comment_id?: Types.ObjectId;
}
