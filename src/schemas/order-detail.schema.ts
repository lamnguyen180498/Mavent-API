import { HydratedDocument, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type OrderDetailDocument = HydratedDocument<OrderDetail>;
export const EProductType = { Course: 0, Product: 1 } as const;

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  strict: 'throw',
  collection: 'order_details',
})
export class OrderDetail {
  @Prop({ type: Types.ObjectId })
  order_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  product_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  product_owner_id: Types.ObjectId;

  @Prop()
  product_name: string;

  @Prop()
  price: number;

  @Prop({ default: 1 })
  quantity: number;

  @Prop({ enum: EProductType, type: Number, default: EProductType.Course })
  type: (typeof EProductType)[keyof typeof EProductType];

  @Prop()
  total_money: number;

  @Prop({ default: 0, required: false })
  discount?: number;

  @Prop({ default: 0, required: false })
  discount_money?: number;

  @Prop({ required: false })
  cohort_code?: string;

  @Prop({ required: false })
  item_code?: string;
}

export const OrderDetailSchema = SchemaFactory.createForClass(OrderDetail);
