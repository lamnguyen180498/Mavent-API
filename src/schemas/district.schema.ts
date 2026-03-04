import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type DistrictDocument = HydratedDocument<District>;

@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  strict: 'throw',
  collection: 'districts',
})
export class District {
  @ApiProperty()
  @Prop({ type: String })
  _id: string;

  @ApiProperty()
  @Prop()
  name: string;

  @ApiProperty()
  @Prop()
  city_id: number;
}

export const DistrictSchema = SchemaFactory.createForClass(District);
