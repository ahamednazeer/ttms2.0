import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, enum: ['SUPERADMIN', 'VENDOR', 'TRANSPORT', 'USER'], default: 'USER' })
  role: string;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop()
  email: string;

  @Prop()
  phone: string;

  @Prop({ type: Types.ObjectId, ref: 'City' })
  cityId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Vendor' })
  vendorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Transport' })
  transportId: Types.ObjectId;

  @Prop({ default: true })
  active: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ email: 1 }, { unique: true, sparse: true });
