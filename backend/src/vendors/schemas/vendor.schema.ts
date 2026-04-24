import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
export type VendorDocument = Vendor & Document;

@Schema({ timestamps: true })
export class Vendor {
  @Prop({ required: true }) vendorName: string;
  @Prop() contact: string;
  @Prop() email: string;
  @Prop({ type: Types.ObjectId, ref: 'City' }) cityId: Types.ObjectId;
  @Prop({ default: true }) active: boolean;
}
export const VendorSchema = SchemaFactory.createForClass(Vendor);
VendorSchema.index({ vendorName: 1 }, { unique: true });
VendorSchema.index({ email: 1 }, { unique: true, sparse: true });
