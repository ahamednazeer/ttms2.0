import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { AUDIT_ACTION_KEY } from './audit.decorator';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const action = this.reflector.get<string>(AUDIT_ACTION_KEY, context.getHandler());
    if (!action) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const baseEntry = {
      action,
      actorId: user?.sub,
      actorRole: user?.role,
      actorUsername: user?.username || request.body?.username,
      targetId: request.params?.id,
      method: request.method,
      path: request.originalUrl || request.url,
      ip: request.ip,
      userAgent: request.headers?.['user-agent'],
      metadata: {
        query: request.query,
      },
    };

    return next.handle().pipe(
      tap((response) => {
        void this.auditService.log({
          ...baseEntry,
          status: 'SUCCESS',
          targetId: baseEntry.targetId || this.extractTargetId(response),
        });
      }),
      catchError((error) => {
        void this.auditService.log({
          ...baseEntry,
          status: 'FAILURE',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });
        return throwError(() => error);
      }),
    );
  }

  private extractTargetId(response: unknown) {
    if (!response || typeof response !== 'object') return undefined;
    const record = response as Record<string, unknown>;
    const id = record._id;
    return typeof id === 'string' ? id : undefined;
  }
}
