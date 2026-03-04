import { HydratedDocument, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type WardDocument = HydratedDocument<Ward>;

@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  strict: 'throw',
  collection: 'wards',
})
export class Ward {
  @ApiProperty()
  @Prop()
  name: string;

  @ApiProperty()
  @Prop()
  code: string;

  @ApiProperty()
  @Prop()
  city_id: Types.ObjectId;
}

export const WardSchema = SchemaFactory.createForClass(Ward);
