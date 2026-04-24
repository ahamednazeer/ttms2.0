import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
export type InvoiceDocument = Invoice & Document;

@Schema({ timestamps: true })
export class Invoice {
  @Prop({ type: Types.ObjectId, ref: 'Vendor', required: true }) vendorId: Types.ObjectId;
  @Prop({ required: true }) month: number;
  @Prop({ required: true }) year: number;
  @Prop([{ type: Types.ObjectId, ref: 'Ticket' }]) tickets: Types.ObjectId[];
  @Prop({ required: true }) totalCost: number;
  @Prop({ default: Date.now }) generatedAt: Date;
}
export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
