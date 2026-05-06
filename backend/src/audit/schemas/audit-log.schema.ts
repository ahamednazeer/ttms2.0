import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ required: true })
  action: string;

  @Prop({ required: true })
  status: 'SUCCESS' | 'FAILURE';

  @Prop()
  actorId?: string;

  @Prop()
  actorRole?: string;

  @Prop()
  actorUsername?: string;

  @Prop()
  targetId?: string;

  @Prop()
  method?: string;

  @Prop()
  path?: string;

  @Prop()
  ip?: string;

  @Prop()
  userAgent?: string;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;

  @Prop()
  errorMessage?: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ status: 1, createdAt: -1 });
AuditLogSchema.index({ actorId: 1, createdAt: -1 });
AuditLogSchema.index({ actorUsername: 1, createdAt: -1 });
