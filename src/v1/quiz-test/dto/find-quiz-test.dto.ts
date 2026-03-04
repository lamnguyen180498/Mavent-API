import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PageOptionsDto } from '../../../base/dto/page-options.dto';
import { SortOrder, Types } from 'mongoose';
import { ObjectIdArrayTransform } from 'src/common/transforms/object-id-array.transform';
import { QuizTestStatusEnum } from '../../../schemas/quiz-test.schema';

export class FilterFindQuizTest {
  creator_id?: Types.ObjectId;

  @ApiPropertyOptional({ type: String, description: 'Từ khóa' })
  @Transform(({ value }) => (value ? value.trim() : undefined))
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    enum: QuizTestStatusEnum,
    description: QuizTestStatusEnum.Public + '',
  })
  @IsOptional()
  @IsEnum(QuizTestStatusEnum)
  @Type(() => Number)
  status?: QuizTestStatusEnum;

  @ApiPropertyOptional({
    description: 'lấy theo id .Ex: ?ids[]=45345&?ids[]=34234234',
  })
  @IsOptional()
  @Transform(ObjectIdArrayTransform)
  tag_ids?: Types.ObjectId[];

  @ApiPropertyOptional({ type: String, description: 'Combo id' })
  @IsOptional()
  @Transform(({ value }) =>
    Types.ObjectId.isValid(value)
      ? Types.ObjectId.createFromHexString(value)
      : undefined,
  )
  combo_id: Types.ObjectId;
}

export class SortFindQuizTest {
  @ApiPropertyOptional({
    type: String,
    description: "= -1 | 1 | 'asc' | 'ascending' | 'desc' | 'descending'",
  })
  @IsOptional()
  createdAt?: SortOrder;
}

export class FindQuizTestDto extends PageOptionsDto {
  @ApiPropertyOptional({ type: FilterFindQuizTest })
  @IsOptional()
  @ValidateNested()
  @Type(() => FilterFindQuizTest)
  filters?: FilterFindQuizTest;

  @ApiPropertyOptional({
    description: 'select theo cột.Ex: ?selects[]=name&?selects[]=des',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selects: string[];

  @ApiPropertyOptional({
    description: 'lấy theo id .Ex: ?ids[]=45345&?ids[]=34234234',
  })
  @IsOptional()
  @Transform(ObjectIdArrayTransform)
  ids: Types.ObjectId[];

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => SortFindQuizTest)
  sort?: SortFindQuizTest;
}

export class GetAllQuizTestDto {
  @ApiPropertyOptional({
    description: 'lấy theo id .Ex: ?ids[]=45345&?ids[]=34234234',
  })
  @IsOptional()
  @Transform(ObjectIdArrayTransform)
  ids: Types.ObjectId[];

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(1, { message: 'validation.MIN' })
  @Max(20, { message: 'validation.MAX' })
  limit?: number;

  creator_id?: Types.ObjectId;
}

export class SelectListQuizTestDto extends PageOptionsDto {
  @ApiPropertyOptional({
    description: 'select theo cột.Ex: ?selects[]=title&?selects[]=code',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selects?: string[];

  @ApiPropertyOptional({
    description: 'Tên Bài kiểm tra',
    type: String,
  })
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({
    description: 'Danh sách Id đề thi',
    type: String,
  })
  @IsOptional()
  @Transform(ObjectIdArrayTransform)
  ids?: Types.ObjectId[];

  @ApiPropertyOptional({ description: 'Từ ngày' })
  @IsOptional()
  @IsString()
  from_date: string;
}
