import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

import { PageOptionsDto } from 'src/base/dto/page-options.dto';

export class FindSubscribeDto extends PageOptionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  keyword: string;

  @ApiPropertyOptional()
  @IsOptional()
  from_date?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  to_date?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  source?: string;
}
