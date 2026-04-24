import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
export type TransportDocument = Transport & Document;

@Schema({ timestamps: true })
export class Transport {
  @Prop({ required: true }) vehicleNo: string;
  @Prop() type: string;
  @Prop() ownerDetails: string;
  @Prop() contact: string;
  @Prop({ type: Types.ObjectId, ref: 'Vendor', required: true }) vendorId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'City' }) cityId: Types.ObjectId;
  @Prop({ default: true }) active: boolean;
}
export const TransportSchema = SchemaFactory.createForClass(Transport);
