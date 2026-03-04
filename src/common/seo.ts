import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, MaxLength } from 'class-validator';
import { Prop } from '@nestjs/mongoose';

export class SEO {
  @ApiPropertyOptional({ description: 'Tiêu đề' })
  @IsOptional()
  @MaxLength(65)
  @Prop()
  title?: string;

  @ApiPropertyOptional({ description: 'Mô tả' })
  @IsOptional()
  @MaxLength(155)
  @Prop()
  description?: string;

  @ApiPropertyOptional({ description: 'Ảnh share' })
  @IsOptional()
  @Prop()
  image?: string;
}
