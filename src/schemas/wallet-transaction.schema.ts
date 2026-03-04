import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Min, ValidateIf } from 'class-validator';
import { HydratedDocument, Types } from 'mongoose';
import { EPaymentGateway } from './order.schema';

export enum WalletTransactionType {
  DEPOSIT = 'deposit', // Nạp tiền vào ví
  WITHDRAW = 'withdraw', // Rút tiền từ ví
  BUY = 'buy', // Mua hàng bằng ví
  SELL = 'sell', // Bán hàng và nhận tiền vào ví
}

export enum WalletTransactionStatus {
  PENDING = 'pending', // Đang xử lý
  APPROVED = 'approved', // Đã duyệt
  CANCELED = 'canceled', // Đã hủy
}

export type WalletTransactionDocument = HydratedDocument<WalletTransaction>;

@Schema({
  collection: 'wallet_transactions',
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  strict: 'throw',
})
export class WalletTransaction {
  @ApiProperty({ description: 'Ví liên quan đến yêu cầu' })
  @IsOptional()
  @Prop({ type: Types.ObjectId })
  wallet_id: Types.ObjectId;

  @ApiProperty({
    description: 'Loại yêu cầu nạp/rút',
    enum: WalletTransactionType,
  })
  @IsEnum(WalletTransactionType)
  @Prop({ enum: WalletTransactionType })
  type: WalletTransactionType;

  @ApiProperty({ description: 'Số tiền' })
  @IsNumber()
  @Min(0, { message: 'validation.MIN' })
  @Type(() => Number)
  @Prop({ type: Number, default: 0, min: 0 })
  amount: number;

  @ApiProperty({ description: 'Phí giao dịch' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Prop({ type: Number, default: 0, min: 0 })
  fee: number;

  @ValidateIf((o) => o.type === WalletTransactionType.DEPOSIT)
  @ApiProperty({ description: 'Cổng thanh toán', enum: EPaymentGateway })
  @IsEnum(EPaymentGateway)
  @Prop({ enum: EPaymentGateway })
  payment_gateway: EPaymentGateway;

  @ValidateIf((o) => o.type === WalletTransactionType.WITHDRAW)
  @ApiProperty({ description: 'Mã ngân hàng' })
  @Prop({ type: String })
  bank_code: string;

  @ValidateIf((o) => o.type === WalletTransactionType.WITHDRAW)
  @ApiProperty({ description: 'Tên ngân hàng' })
  @Prop({ type: String })
  bank_name: string;

  @ValidateIf((o) => o.type === WalletTransactionType.WITHDRAW)
  @ApiProperty({ description: 'Số tài khoản' })
  @Prop({ type: String })
  account_number: string;

  @ApiProperty({ description: 'Mã giao dịch từ cổng thanh toán' })
  @Prop({ type: String })
  transaction_id: string;

  @ApiProperty({
    description: 'Trạng thái yêu cầu',
    enum: WalletTransactionStatus,
  })
  @IsOptional()
  @IsEnum(WalletTransactionStatus)
  @Prop({
    required: true,
    enum: WalletTransactionStatus,
    default: WalletTransactionStatus.PENDING,
  })
  status: WalletTransactionStatus;

  @ApiProperty({ description: 'Ghi chú' })
  @IsOptional()
  @Prop({ type: String })
  note?: string;

  @ApiProperty({ description: 'Danh sách tệp đính kèm', type: [String] })
  @Prop({ type: [String], default: [] })
  attachments: string[];

  @ApiProperty({ description: 'Người duyệt yêu cầu' })
  @IsOptional()
  @Prop({ type: Types.ObjectId, ref: 'User' })
  approved_by?: Types.ObjectId;

  @ApiProperty({ description: 'Thời gian duyệt' })
  @IsOptional()
  @Prop({ type: Date })
  approved_at?: Date;

  @ApiProperty({ description: 'Người tạo yêu cầu' })
  @Prop({ type: Types.ObjectId })
  created_by: Types.ObjectId;

  @ApiProperty({ description: 'Mã đơn hàng' })
  @IsOptional()
  @Prop({ type: Types.ObjectId })
  order_id: Types.ObjectId;
}

export const WalletTransactionSchema =
  SchemaFactory.createForClass(WalletTransaction);
