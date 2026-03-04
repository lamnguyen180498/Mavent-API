import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export type PaymentReceiptDocument = HydratedDocument<PaymentReceipt>;

export enum EPaymentStatus {
  Processing = 0,
  Approved = 1,
}

@Schema({
  collection: 'payment_receipts',
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  strict: 'throw',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class PaymentReceipt {
  @ApiPropertyOptional({
    description: 'Mã phiếu thu',
  })
  @Prop({ type: Number })
  @IsOptional()
  receipt_code?: number;

  @ApiPropertyOptional({
    type: String,
    description: 'Id đơn hàng',
  })
  @Prop({ type: Types.ObjectId })
  order_id: Types.ObjectId;

  @ApiPropertyOptional({
    type: String,
    description: 'Ghi chú',
  })
  @Prop({ type: String })
  note: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Id người tạo phiếu',
  })
  @Prop({ type: Types.ObjectId })
  creator_id?: Types.ObjectId;

  @ApiPropertyOptional({
    type: String,
    description: 'Id người duyệt phiếu',
  })
  @Prop({ type: Types.ObjectId })
  approver_id: Types.ObjectId;

  @ApiPropertyOptional({
    type: Date,
    description: 'Thời gian duyệt phiếu',
  })
  @Prop({ type: Date })
  approved_time: Date;

  @ApiProperty({
    type: Number,
    description:
      'Tổng tiền của đơn hàng (origin (chưa tính giảm trừ bất kỳ khoản phí nào))',
  })
  @Prop({ default: 0 })
  total_money: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Phí giao dịch (đơn vị: %)',
  })
  @Prop({ default: 0 })
  transaction_fees?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Tiền phí giao dịch',
  })
  @Prop({ default: 0 })
  transaction_money?: number;

  @ApiPropertyOptional({
    type: Number,
    description: '% giảm giá',
  })
  @Prop({ default: 0 })
  discount_value?: number;

  @ApiPropertyOptional({
    description: 'Cổng thanh toán',
  })
  @Prop({ type: String })
  @IsOptional()
  pay_gate?: string;

  @ApiPropertyOptional({
    type: Number,
    description: 'phí cổng TT nếu có',
  })
  @Prop({ default: 0 })
  pay_gate_fee?: number;

  @ApiProperty({
    type: Number,
    description:
      'Thực thu từ đơn hàng sau khi trừ các khoản phí (phí cổng thanh toán (nếu có), phí giao dịch, mã giảm giá (nếu có))',
  })
  @Prop({ default: 0 })
  revenue: number;

  @ApiPropertyOptional({ description: 'Ngày nhận tiền' })
  @Prop({ type: Date })
  received_money_date?: Date;

  @ApiPropertyOptional({
    enum: EPaymentStatus,
    description: 'Trạng thái phiếu, 0: chờ duyệt, 1: đã duyệt',
  })
  @Prop({ enum: EPaymentStatus, default: EPaymentStatus.Processing })
  @IsEnum(EPaymentStatus)
  status: EPaymentStatus;
}

export const PaymentReceiptSchema =
  SchemaFactory.createForClass(PaymentReceipt);
