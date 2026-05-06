import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';
import { getPagination, paginatedResult } from '../common/utils/pagination.util';

export interface AuditLogInput {
  action: string;
  status: 'SUCCESS' | 'FAILURE';
  actorId?: string;
  actorRole?: string;
  actorUsername?: string;
  targetId?: string;
  method?: string;
  path?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  errorMessage?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(@InjectModel(AuditLog.name) private model: Model<AuditLogDocument>) {}

  async findAll(query?: {
    action?: string;
    status?: 'SUCCESS' | 'FAILURE';
    actorId?: string;
    actorUsername?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) {
    const filter: Record<string, unknown> = {};
    const { page, limit, skip } = getPagination(query);

    if (query?.action) filter.action = query.action;
    if (query?.status) filter.status = query.status;
    if (query?.actorId) filter.actorId = query.actorId;
    if (query?.actorUsername) {
      filter.actorUsername = { $regex: query.actorUsername, $options: 'i' };
    }
    if (query?.dateFrom || query?.dateTo) {
      filter.createdAt = {};
      if (query.dateFrom) {
        (filter.createdAt as Record<string, unknown>).$gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        const endOfDay = new Date(query.dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        (filter.createdAt as Record<string, unknown>).$lte = endOfDay;
      }
    }

    const [logs, total] = await Promise.all([
      this.model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
      this.model.countDocuments(filter),
    ]);
    return paginatedResult(logs, total, page, limit);
  }

  async log(entry: AuditLogInput) {
    try {
      await this.model.create(entry);
    } catch (error) {
      this.logger.error(
        `Failed to persist audit log for action ${entry.action}: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }
}
