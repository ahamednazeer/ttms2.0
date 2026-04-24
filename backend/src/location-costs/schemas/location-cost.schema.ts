import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
export type LocationCostDocument = LocationCost & Document;

@Schema({ timestamps: true })
export class LocationCost {
  @Prop({ type: Types.ObjectId, ref: 'Location', required: true }) fromLocationId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Location', required: true }) toLocationId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'City', required: true }) cityId: Types.ObjectId;
  @Prop({ required: true }) cost: number;
  @Prop({ required: true }) distance: number;
}
export const LocationCostSchema = SchemaFactory.createForClass(LocationCost);
LocationCostSchema.index({ cityId: 1, fromLocationId: 1, toLocationId: 1 }, { unique: true });
