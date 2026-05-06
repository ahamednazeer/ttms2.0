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
  @Prop({ default: 'DRAFT', enum: ['DRAFT', 'APPROVED', 'REJECTED'] }) status: string;
  @Prop() adminRemarks: string;
}
export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
InvoiceSchema.index({ generatedAt: -1 });
InvoiceSchema.index({ vendorId: 1, month: 1, year: 1 }, { unique: true });
InvoiceSchema.index({ status: 1, generatedAt: -1 });
