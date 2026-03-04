import { HydratedDocument, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsEmail } from 'class-validator';
import { OrderDetailDocument } from './order-detail.schema';

export type OrderDocument = HydratedDocument<Order>;

export enum EProcessStatus {
  New = 0, // Đơn hàng mới
  Contact = 1, // Đã liên hệ
  Delivering = 2, // Đang giao hàng
  Delivered = 3, // Đã giao hàng
  Cancel = 4, // Đã hủy
  RefundOrder = 5, // Đơn hàng hoàn tiền
  RefundMoney = 6, // Hoàn tiền
  Deleted = 7, // Đã xóa
}

export enum EPaymentStatus {
  UnPaid = 0,
  Paid = 1,
  Cancel = 2,
  Free = 3,
  Error = 4,
}

export enum EPaymentType {
  Online = 1,
  Transfer = 2,
  Cod = 3,
  Sms = 4,
}
export enum EPaymentGateway {
  VNPay = 'vnpay',
  SePay = 'sepay',
  Wallet = 'wallet',
}

export enum ETransactionPrefix {
  DEPOSIT = 'NAP',
  WITHDRAW = 'RUT',
  BUY_COURSE = 'DH',
}

@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  strict: 'throw',
  collection: 'orders',
})
export class Order {
  @Prop({ type: Types.ObjectId })
  creator_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  user_id?: Types.ObjectId;

  @Prop()
  full_name: string;

  @Prop()
  phone: string;

  @Prop()
  @IsEmail()
  email: string;

  @Prop()
  address: string;

  @Prop()
  total_money: number;

  @Prop()
  city_id: Types.ObjectId;

  @Prop()
  ward_id: Types.ObjectId;

  @Prop()
  payment_fee: number;

  @Prop()
  revenue: number;

  @Prop()
  payment_time?: Date;

  @Prop({ enum: EPaymentType })
  payment_type?: EPaymentType;

  @Prop({ enum: EPaymentGateway, default: EPaymentGateway.VNPay, type: String })
  payment_gateway?: EPaymentGateway;

  @Prop({ enum: EProcessStatus })
  process_status: EProcessStatus;

  @Prop({ enum: EPaymentStatus, type: Number })
  payment_status: (typeof EPaymentStatus)[keyof typeof EPaymentStatus];

  @Prop()
  note?: string;

  order_details: OrderDetailDocument[];
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.virtual('order_details', {
  ref: 'OrderDetail',
  localField: '_id',
  foreignField: 'order_id',
});
