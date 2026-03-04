import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsPhoneNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export enum ESource {
  Contact = 'contact',
  Subscribe = 'subscribe',
}
@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  strict: 'throw',
  collection: 'subscribes',
})
export class Subscribe {
  @ApiProperty({ description: 'Họ và tên' })
  @Prop()
  full_name?: string;

  @ApiProperty({ description: 'Địa chỉ email' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @Transform(({ value }) => value.toLowerCase())
  @Prop()
  email: string;

  @ApiProperty({ description: 'Số điện thoại' })
  @IsPhoneNumber('VN')
  @Prop()
  phone?: string;

  @ApiProperty({ description: 'Nội dung' })
  @IsOptional()
  @Prop()
  content?: string;

  @ApiProperty({ description: 'Nguồn' })
  @IsEnum(ESource)
  @Prop({ enum: ESource, type: String, default: ESource.Subscribe })
  source: (typeof ESource)[keyof typeof ESource];

  @ApiProperty({ description: 'Đã liên hệ' })
  @Prop({ type: Boolean, default: false })
  is_contacted?: boolean;
}

export const SubscribeSchema = SchemaFactory.createForClass(Subscribe);
