import { PageOptionsDto } from '../../../base/dto/page-options.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class SyncCourseDto extends PageOptionsDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Thiếu token' })
  token: string;
}
