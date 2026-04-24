import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CityDocument = City & Document;

@Schema({ timestamps: true })
export class City {
  @Prop({ required: true }) cityId: string;
  @Prop({ required: true }) cityName: string;
}

export const CitySchema = SchemaFactory.createForClass(City);
CitySchema.index({ cityId: 1 }, { unique: true });
CitySchema.index({ cityName: 1 }, { unique: true });
