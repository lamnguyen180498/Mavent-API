import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { SortOrder, Types } from 'mongoose';
import { ObjectIdArrayTransform } from '../../../common/transforms/object-id-array.transform';
import { ObjectIdTransform } from '../../../common/transforms/objectid.transform';
import { PageOptionsDto } from '../../../base/dto/page-options.dto';


export class FilterFindResult {
  @ApiPropertyOptional({ type: String, description: 'user_ids' })
  @IsOptional()
  @Transform(ObjectIdArrayTransform)
  user_ids?: Types.ObjectId[];

  @ApiPropertyOptional({ type: String, description: 'Quiz test id' })
  @IsOptional()
  @Transform(ObjectIdTransform)
  test_id?: Types.ObjectId;

  @ApiPropertyOptional({ type: String, description: 'Course_id' })
  @IsOptional()
  @Transform(ObjectIdTransform)
  course_id?: Types.ObjectId;

  @ApiPropertyOptional({ type: Date, description: 'Lọc thời gian làm bài' })
  @IsOptional()
  start?: Date;

  @ApiPropertyOptional({
    type: Date,
    description: 'Lọc thời gian làm bài',
  })
  @IsOptional()
  end?: Date;
}

export class SortFindResult {
  @ApiPropertyOptional({
    type: String,
    description: "= -1 | 1 | 'asc' | 'ascending' | 'desc' | 'descending'",
  })
  @IsOptional()
  _id?: SortOrder;
}

export class FindAllResult extends PageOptionsDto {
  @ApiPropertyOptional({ type: FilterFindResult })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FilterFindResult)
  filters?: FilterFindResult;

  @ApiPropertyOptional({
    description: 'select theo cột.Ex: ?selects[]=name&?selects[]=des',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selects: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => SortFindResult)
  sort?: SortFindResult;
}
