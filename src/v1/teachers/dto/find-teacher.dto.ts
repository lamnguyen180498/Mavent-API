import { PageOptionsDto } from '../../../base/dto/page-options.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RegistrationStatus } from '../../../schemas/teacher.schema';
import { Transform, Type } from 'class-transformer';
import { BooleanTransform } from '../../../common/transforms/boolean.transform';

export class FindTeacherDto extends PageOptionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(RegistrationStatus)
  @Type(() => Number)
  status?: RegistrationStatus;

  @ApiPropertyOptional({
    description: 'Có phân trang hay không',
    default: true,
  })
  @IsOptional()
  @Transform(BooleanTransform)
  is_paginate?: boolean;

  @IsOptional()
  @Transform(BooleanTransform)
  have_course?: boolean;
}
