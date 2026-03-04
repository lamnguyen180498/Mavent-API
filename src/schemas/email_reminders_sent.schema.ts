import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type EmailRemindersSentDocument = HydratedDocument<EmailRemindersSent>;

@Schema({
  collection: 'email_reminders_sent',
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  strict: 'throw',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class EmailRemindersSent {
  @Prop({ type: Types.ObjectId })
  course_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  teacher_id?: Types.ObjectId;

  @Prop()
  email?: string;

  @Prop({ type: Date })
  recurrence_datetime: Date;

  @Prop({ type: Date })
  sent_at: Date;

  @Prop()
  type: string;
}

export const EmailRemindersSentSchema =
  SchemaFactory.createForClass(EmailRemindersSent);
