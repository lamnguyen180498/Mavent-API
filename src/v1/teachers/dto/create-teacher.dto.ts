import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTeacherDto {
  @ApiProperty({ description: 'Họ và tên' })
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  @Length(2, 50, { message: 'Họ và tên phải từ 2 đến 50 ký tự' })
  full_name: string;

  @ApiProperty({ description: 'Email' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @ApiProperty({ type: String, description: 'Số điện thoại' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ type: String, description: 'Mã số thuế' })
  @IsNotEmpty()
  @IsString()
  tax_code: string;

  @ApiProperty({ type: String, description: 'Số căn cước công dân' })
  @IsNotEmpty()
  @IsString()
  cic: string;

  @ApiProperty({ type: String, description: 'Địa chỉ' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({ type: Date, description: 'Ngày cấp' })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  issue_date: Date;

  @ApiProperty({ type: String, description: 'Nơi cấp' })
  @IsNotEmpty()
  @IsString()
  identification_place: string;

  @ApiPropertyOptional({ description: 'Tài khoản ngân hàng' })
  @IsOptional()
  @IsString()
  bank_account_number?: string;

  @ApiPropertyOptional({ description: 'Tên ngân hàng' })
  @IsOptional()
  @IsString()
  bank_name?: string;

  @ApiPropertyOptional({ description: 'Học vấn' })
  @IsOptional()
  @IsString()
  education?: string;

  @ApiPropertyOptional({ description: 'Video giới thiệu vấn' })
  @IsOptional()
  @IsString()
  video?: string;
}
