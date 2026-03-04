import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ProductDto } from '../create-order.dto';
import { ObjectIdTransform } from 'src/common/transforms/objectid.transform';
import { Types } from 'mongoose';

export class AdminCreateOrderDto {
  @ApiProperty()
  @IsNotEmpty({
    message: 'Sản phẩm không được để trống',
  })
  @IsArray()
  products: ProductDto[];

  @IsNotEmpty({
    message: 'Họ tên không được để trống',
  })
  @IsString()
  full_name: string;

  @IsNotEmpty({
    message: 'Số điện thoại không được để trống',
  })
  @IsPhoneNumber('VN')
  phone: string;

  @IsNotEmpty({
    message: 'Email không được để trống',
  })
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase())
  email: string;

  @IsOptional()
  address?: string;

  @IsOptional()
  @Transform(ObjectIdTransform)
  city_id?: Types.ObjectId;

  @IsOptional()
  @Transform(ObjectIdTransform)
  ward_id?: Types.ObjectId;

  @IsOptional()
  note: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  process_status: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  payment_type: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  payment_status: number;
}
