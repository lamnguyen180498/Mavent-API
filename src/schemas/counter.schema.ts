import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type CounterDocument = HydratedDocument<Counter>;

@Schema({
  timestamps: false,
  strict: 'throw',
  collection: 'counters',
})
export class Counter {
  @Prop({ type: String, auto: false })
  _id: string;

  @Prop()
  sequence_value: number;
}

export const CounterSchema = SchemaFactory.createForClass(Counter);
