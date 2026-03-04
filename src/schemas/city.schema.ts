import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type CityDocument = HydratedDocument<City>;

@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  strict: 'throw',
  collection: 'cities',
})
export class City {
  @ApiProperty()
  @Prop()
  name: string;

  @ApiProperty()
  @Prop()
  code: string;
}

export const CitySchema = SchemaFactory.createForClass(City);
