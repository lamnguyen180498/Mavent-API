import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsDate } from 'class-validator';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './user.schema';

export type RevokeTokenDocument = HydratedDocument<RevokeToken>;

@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  collection: 'revoke_tokens',
  strict: 'throw',
})
export class RevokeToken {
  @Prop({ required: true, type: Types.ObjectId, ref: User.name })
  user_id: User;

  @Prop({ required: true })
  token: string;

  @Prop()
  @IsDate()
  revoked_at?: Date;

  @Prop()
  note?: string;
}

export const RevokeTokenSchema = SchemaFactory.createForClass(RevokeToken);
