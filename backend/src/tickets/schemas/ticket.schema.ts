import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
export type TicketDocument = Ticket & Document;

@Schema({ timestamps: true })
export class Ticket {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) userId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'City' }) cityId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Location', required: true }) pickupLocationId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Location', required: true }) dropLocationId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Transport' }) transportId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Vendor' }) vendorId: Types.ObjectId;
  @Prop({ required: true }) pickupDate: Date;
  @Prop({ enum: ['PENDING', 'ASSIGNED', 'RIDE_STARTED', 'COMPLETED', 'CANCELLED'], default: 'PENDING' }) status: string;
  @Prop() otp: string;
  @Prop() rideStartTime: Date;
  @Prop() rideEndTime: Date;
  @Prop() cost: number;
  @Prop() userName: string;
}
export const TicketSchema = SchemaFactory.createForClass(Ticket);
TicketSchema.index({ createdAt: -1 });
TicketSchema.index({ status: 1, createdAt: -1 });
TicketSchema.index({ userId: 1, createdAt: -1 });
TicketSchema.index({ vendorId: 1, status: 1, createdAt: -1 });
TicketSchema.index({ transportId: 1, status: 1, createdAt: -1 });
TicketSchema.index({ cityId: 1, status: 1, vendorId: 1, createdAt: -1 });
TicketSchema.index({ vendorId: 1, status: 1, rideEndTime: 1 });
