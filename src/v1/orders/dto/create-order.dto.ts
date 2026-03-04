import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Types } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EProductType } from '../../../schemas/order-detail.schema';
import { ObjectIdTransform } from '../../../common/transforms/objectid.transform';
import { EPaymentGateway } from '../../../schemas/order.schema';

export class InfoUserDto {
  @IsString()
  full_name: string;

  @IsPhoneNumber()
  phone: string;

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
}

export class ProductDto {
  @ApiProperty({ type: String, description: 'Id Order detail' })
  @IsOptional()
  id?: Types.ObjectId;

  @ApiProperty({ type: String, description: 'Id sản phẩm' })
  @IsNotEmpty()
  @Transform(ObjectIdTransform)
  product_id: Types.ObjectId;

  @ApiProperty()
  product_name: string;

  @ApiProperty()
  product_price: number;

  @ApiProperty()
  @IsNumber()
  product_quantity: number;

  @ApiPropertyOptional({ default: EProductType.Course })
  type: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  cohort_code?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  item_code?: string;
}

export class CreateOrderDto {
  @IsOptional()
  info_user?: InfoUserDto;

  @ApiProperty()
  @IsNotEmpty({ message: 'Sản phẩm không được để trống' })
  @IsArray()
  products: ProductDto[];

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

  @ApiProperty({
    description: 'Phương thức thanh toán',
    example: EPaymentGateway.VNPay,
    enum: EPaymentGateway,
  })
  @IsNotEmpty({ message: 'Phương thức thanh toán không được để trống' })
  @Transform(({ value }) => value?.toString().trim().toLowerCase())
  @IsEnum(EPaymentGateway, { message: 'Phương thức thanh toán không hợp lệ' })
  payment_gateway: string;
}
