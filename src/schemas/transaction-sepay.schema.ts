import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TransactionSepayDocument = HydratedDocument<TransactionSepay>;
export enum ETypeSepay {
  In = 'vnpay',
  Out = 'sepay',
}
@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  strict: 'throw',
  collection: 'transaction_sepay',
})
export class TransactionSepay {
  @Prop()
  id_gg: string;

  @Prop()
  gate_way: string;

  @Prop({ enum: ETypeSepay, type: String })
  type: ETypeSepay;

  @Prop()
  transaction_date: Date;

  @Prop()
  account_number: string;

  @Prop()
  sub_account?: string;

  @Prop()
  amount: number;

  @Prop()
  accumulated?: number;

  @Prop()
  code?: string;

  @Prop()
  transaction_content: string;

  @Prop()
  reference_number?: string;

  @Prop()
  body?: string;
}

export const TransactionSepaySchema =
  SchemaFactory.createForClass(TransactionSepay);
