import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Types } from 'mongoose';
import { ObjectIdTransform } from 'src/common/transforms/objectid.transform';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({ description: 'Họ và tên' })
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  @Length(2, 50, { message: 'Họ và tên phải từ 2 đến 50 ký tự' })
  full_name: string;

  @ApiProperty({ description: 'Email' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @ApiProperty({ description: 'Số điện thoại' })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @IsPhoneNumber('VN', {
    message: 'Số điện thoại không hợp lệ',
  })
  phone: string;

  @ApiPropertyOptional({ description: 'Thành phố' })
  @IsOptional()
  @Transform(ObjectIdTransform)
  city_id?: Types.ObjectId;

  @ApiPropertyOptional({ description: 'Phường, xã' })
  @IsOptional()
  @Transform(ObjectIdTransform)
  ward_id?: Types.ObjectId;

  @ApiPropertyOptional({ description: 'Địa chỉ' })
  @IsOptional()
  @Transform(({ value }) => String(value))
  address?: string;

  @ApiPropertyOptional({ description: 'Ngày sinh' })
  @IsOptional()
  birthday?: Date;

  @ApiPropertyOptional({ description: 'Giới tính (1: Nam, 2: Nữ)' })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  sex?: number;

  @ApiPropertyOptional({ description: 'Mật khẩu mới' })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password?: string;

  @IsOptional()
  avatar?: string;
}
