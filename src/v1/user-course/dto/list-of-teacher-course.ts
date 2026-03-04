import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { PageOptionsDto } from '../../../base/dto/page-options.dto';
import { Transform } from 'class-transformer';
import { BooleanTransform } from '../../../common/transforms/boolean.transform';

export class ListOfByTeacherDto extends PageOptionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({
    description: 'Có phân trang hay không',
    default: true,
  })
  @IsOptional()
  @Transform(BooleanTransform)
  is_paginate?: boolean;
}
