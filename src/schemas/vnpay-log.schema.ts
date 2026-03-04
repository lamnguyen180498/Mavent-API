import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type VnPayLogDocument = HydratedDocument<VnPayLog>;

@Schema({ timestamps: true, strict: 'throw', collection: 'vnpay_logs' })
export class VnPayLog {
  @Prop({ type: Object })
  rawJson: Record<string, any>;

  @Prop({ type: String })
  orderId?: string;

  @Prop({ type: String })
  responseCode?: string;

  @Prop({ type: String })
  transactionStatus?: string;

  @Prop({ type: String })
  secureHash?: string;

  @Prop({ type: String })
  verificationResult?: 'success' | 'fail';

  @Prop({ type: String })
  resultMessage?: string;

  @Prop({ type: String })
  rspCode?: string;

  @Prop({ type: String })
  ipAddress?: string;
}

export const VnPayLogSchema = SchemaFactory.createForClass(VnPayLog);
