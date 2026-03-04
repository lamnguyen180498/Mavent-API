import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { RegistrationStatus } from '../../../schemas/teacher.schema';

export class UpdateStatusTeacherDto {
  @ApiProperty({
    enum: RegistrationStatus,
    description: 'Trạng thái đăng ký',
  })
  @IsOptional()
  @IsEnum(RegistrationStatus)
  status: RegistrationStatus;
}
