import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { PageOptionsDto } from 'src/base/dto/page-options.dto';

export class FilterWalletTransactionDto extends PageOptionsDto {
  @ApiPropertyOptional({ description: 'Loại yêu cầu nạp/rút' })
  @IsOptional()
  type?: string | string[];

  @ApiPropertyOptional({ description: 'Trạng thái yêu cầu' })
  @IsOptional()
  status?: string | string[];

  @ApiPropertyOptional()
  @IsOptional()
  from_date?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  to_date?: Date;
}
