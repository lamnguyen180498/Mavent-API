import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';
import { PageOptionsDto } from 'src/base/dto/page-options.dto';
import { BooleanTransform } from 'src/common/transforms/boolean.transform';
import { ObjectIdTransform } from 'src/common/transforms/objectid.transform';
import { BlogStatusEnum } from 'src/schemas/blog.schema';

export class FilterBlogDto extends PageOptionsDto {
  @ApiPropertyOptional({
    description: 'Id danh mục',
  })
  @IsOptional()
  @Transform(ObjectIdTransform)
  category_id?: Types.ObjectId;

  @ApiPropertyOptional({
    description: 'Tìm kiếm theo tên bài viết',
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: 'Trạng thái bài viết',
  })
  @IsOptional()
  @IsEnum(BlogStatusEnum)
  @Type(() => Number)
  status?: BlogStatusEnum;

  @ApiPropertyOptional()
  @IsOptional()
  from_date?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  to_date?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(BooleanTransform)
  exclude_featured?: boolean;
}
