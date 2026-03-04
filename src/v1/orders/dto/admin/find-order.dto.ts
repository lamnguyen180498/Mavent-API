import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { PageOptionsDto } from 'src/base/dto/page-options.dto';

export class AdminFindOrderDto extends PageOptionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  keyword: string;

  @ApiPropertyOptional()
  @IsOptional()
  type_search?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  payment_type?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  payment_status?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  process_status?: number;

  @ApiPropertyOptional()
  @IsOptional()
  from_date?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  to_date?: Date;
}
