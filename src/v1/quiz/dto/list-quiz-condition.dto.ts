import { PageOptionsDto } from '../../../base/dto/page-options.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional } from 'class-validator';
import { Types } from 'mongoose';
import { EQuizType } from '../../../schemas/quiz.schema';
import { Transform } from 'class-transformer';
import { ObjectIdArrayTransform } from '../../../common/transforms/object-id-array.transform';
import { ObjectIdTransform } from '../../../common/transforms/objectid.transform';

export class ListQuizConditionDto extends PageOptionsDto {
  @ApiPropertyOptional({ description: 'Câu hỏi' })
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({
    description: 'Loại câu hỏi',
    enum: EQuizType,
  })
  @IsOptional()
  @IsEnum(EQuizType, { each: true })
  type?: EQuizType;

  @ApiPropertyOptional({ type: [String], description: 'Tag ids' })
  @IsOptional()
  @Transform(ObjectIdArrayTransform)
  @IsArray()
  tag_ids?: Types.ObjectId[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Lấy theo id chỉ định',
  })
  @IsOptional()
  @IsArray()
  @Transform(ObjectIdArrayTransform)
  ids?: Types.ObjectId[];

  @ApiPropertyOptional({
    isArray: true,
    type: () => [String],
    description: 'Ngoại trừ những id này (ưu tiên ids)',
  })
  @IsOptional()
  @IsArray()
  @Transform(ObjectIdArrayTransform)
  except_ids?: Types.ObjectId[];

  @ApiPropertyOptional({ type: String, description: 'Id danh mục' })
  @IsOptional()
  @Transform(ObjectIdTransform)
  category_id?: string;
}
