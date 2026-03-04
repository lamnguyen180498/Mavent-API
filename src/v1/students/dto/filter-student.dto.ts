import { PageOptionsDto } from '../../../base/dto/page-options.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { BooleanTransform } from '../../../common/transforms/boolean.transform';

export class FilterStudentDto extends PageOptionsDto {
  @ApiPropertyOptional({ description: 'Họ tên, email hoặc số điện thoại' })
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({ description: 'Thanh toán khóa học' })
  @IsOptional()
  @Transform(BooleanTransform)
  paid?: boolean;
}
