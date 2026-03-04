import { ApiProperty } from '@nestjs/swagger';
import { genSaltSync, hashSync } from 'bcrypt';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token' })
  @IsNotEmpty({ message: 'Token không được để trống' })
  @IsString()
  code: string;

  @ApiProperty({ name: 'password', description: 'Mật khẩu mới' })
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
