import {
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { genSaltSync, hashSync } from 'bcrypt';

export class RegisterDto {
  @ApiProperty({ description: 'Họ và tên' })
  @IsNotEmpty({ message: 'Tên không được để trống' })
  @IsString({ message: 'Tên phải là chuỗi' })
  @MinLength(3, { message: 'Tên phải có ít nhất 3 ký tự' })
  @MaxLength(50, { message: 'Tên không được vượt quá 50 ký tự' })
  full_name: string;

  @ApiProperty({ description: 'Tên đăng nhập' })
  @IsNotEmpty({ message: 'Tên đăng nhập không được để trống' })
  @IsString({ message: 'Tên đăng nhập phải là chuỗi' })
  @MinLength(3, { message: 'Tên đăng nhập phải có ít nhất 3 ký tự' })
  @MaxLength(20, { message: 'Tên đăng nhập không được vượt quá 20 ký tự' })
  @Matches(/^[a-zA-Z0-9]+$/, {
    message: 'Tên đăng nhập chỉ được chứa chữ cái và số',
  })
  username: string;

  @ApiProperty({ description: 'Địa chỉ email' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @Transform(({ value }) => value.toLowerCase())
  email: string;

  @ApiProperty({ description: 'Số điện thoại' })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @IsPhoneNumber('VN', { message: 'Số điện thoại không hợp lệ' })
  phone: string;

  @ApiProperty({ name: 'password', description: 'Mật khẩu' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @IsString({ message: 'Mật khẩu phải là chuỗi' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  private _password?: string;

  get password() {
    return this._password;
  }

  set password(newPass: string) {
    this._password = hashSync(newPass, genSaltSync());
  }
}
