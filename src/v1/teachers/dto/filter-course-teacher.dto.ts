import { Optional } from '@nestjs/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PageOptionsDto } from 'src/base/dto/page-options.dto';

export class FilterCourseTeacherDto extends PageOptionsDto {
  @ApiPropertyOptional({ description: 'Email' })
  @Optional()
  email?: string;

  @ApiPropertyOptional({ description: 'Tên khóa học' })
  @Optional()
  title?: string;

  @ApiPropertyOptional({ description: 'Số điện thoại' })
  @Optional()
  phone?: string;
}
