import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { Types } from 'mongoose';

export class GetTestLearnDto {
  @ApiPropertyOptional({
    type: String,
    description: 'Kiểu lấy câu hỏi vào đề thi',
  })
  @IsOptional()
  setting_test_id?: Types.ObjectId;
}
