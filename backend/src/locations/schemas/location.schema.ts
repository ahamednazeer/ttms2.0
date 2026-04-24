import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
export type LocationDocument = Location & Document;

@Schema({ timestamps: true })
export class Location {
  @Prop({ required: true }) locationName: string;
  @Prop({ type: Types.ObjectId, ref: 'City', required: true }) cityId: Types.ObjectId;
  @Prop({ default: true }) active: boolean;
}
export const LocationSchema = SchemaFactory.createForClass(Location);
