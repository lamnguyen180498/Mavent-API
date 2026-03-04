import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Types } from 'mongoose';
import { ObjectIdTransform } from 'src/common/transforms/objectid.transform';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Tên danh mục' })
  @IsNotEmpty({ message: 'Tên không được để trống' })
  @IsString({ message: 'Tên phải là chuỗi' })
  @MaxLength(100, { message: 'Tên không được quá 100 ký tự' })
  name: string;

  @ApiPropertyOptional({ description: 'Mô tả' })
  @IsOptional()
  @IsString({ message: 'Tên phải là chuỗi' })
  description: string;

  @ApiPropertyOptional({ description: 'Danh mục cha' })
  @IsOptional()
  @Transform(ObjectIdTransform)
  parent_id?: Types.ObjectId;
}
