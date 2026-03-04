import { PageOptionsDto } from '../../../base/dto/page-options.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { Types } from 'mongoose';
import { ObjectIdArrayTransform } from '../../../common/transforms/object-id-array.transform';
import { ObjectIdTransform } from '../../../common/transforms/objectid.transform';

export class FindLessonByCourseDto extends PageOptionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(ObjectIdTransform)
  parent_id?: Types.ObjectId;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(ObjectIdArrayTransform)
  in_parent?: Types.ObjectId[];
}
