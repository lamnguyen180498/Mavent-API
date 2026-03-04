import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { HydratedDocument, Types } from 'mongoose';
import { ObjectIdTransform } from 'src/common/transforms/objectid.transform';

export enum WalletStatus {
  ACTIVE = 1, // Ví đang hoạt động
  INACTIVE = 2, // Ví không hoạt động
  SUSPENDED = -1, // Ví bị tạm ngưng
}

export type WalletDocumnet = HydratedDocument<Wallet>;

@Schema({
  collection: 'wallets',
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  strict: 'throw',
})
export class Wallet {
  @ApiProperty({ description: 'Chủ sở hữu ví' })
  @IsOptional()
  @Prop({ type: Types.ObjectId })
  @Transform(ObjectIdTransform)
  user_id: Types.ObjectId;

  @ApiProperty({ description: 'Số dư của ví', default: 0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Prop({ type: Number, default: 0, min: 0 })
  balance: number;

  @ApiProperty({
    description: 'Trạng thái của ví',
    enum: WalletStatus,
    default: WalletStatus.ACTIVE,
  })
  @IsEnum(WalletStatus)
  @Type(() => Number)
  @Prop({
    required: true,
    default: WalletStatus.ACTIVE,
    enum: WalletStatus,
  })
  status: WalletStatus;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);
