import { HydratedDocument, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type RoleDocument = HydratedDocument<Role>;

@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  strict: 'throw',
  collection: 'roles',
})
export class Role {
  @Prop()
  name: string;

  @Prop()
  description?: string;

  @Prop()
  content_block?: string;

  @Prop()
  type: string;

  @Prop({ type: Types.ObjectId })
  parent?: Types.ObjectId;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
