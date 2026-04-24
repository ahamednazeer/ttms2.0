import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { AssignTransportDto } from './dto/assign-transport.dto';
import { CompleteRideDto } from './dto/complete-ride.dto';
import { TicketQueryDto } from './dto/ticket-query.dto';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { AuditAction } from '../audit/audit.decorator';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { Throttle } from '@nestjs/throttler';

interface AuthenticatedRequest {
  user: {
    sub: string;
    role: string;
    cityId?: string;
    vendorId?: string;
    transportId?: string;
  };
}

@Controller('ride-ticket')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
  constructor(private svc: TicketsService) {}

  @Get()
  findAll(@Query() query: TicketQueryDto, @Request() req: AuthenticatedRequest) {
    return this.svc.findAll(query, req.user);
  }

  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string, @Request() req: AuthenticatedRequest) {
    return this.svc.findOne(id, req.user);
  }

  @Post()
  @Roles('USER', 'SUPERADMIN')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @AuditAction('TICKET_CREATE')
  @UseInterceptors(AuditInterceptor)
  create(@Body() data: CreateTicketDto, @Request() req: AuthenticatedRequest) {
    if (req.user.role !== 'USER' && req.user.role !== 'SUPERADMIN') {
      throw new ForbiddenException('Insufficient permissions to create ticket');
    }
    return this.svc.create(data, req.user.sub);
  }

  @Post(':id/assign')
  @Roles('SUPERADMIN', 'VENDOR')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @AuditAction('TICKET_ASSIGN_TRANSPORT')
  @UseInterceptors(AuditInterceptor)
  assignTransport(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() body: AssignTransportDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.svc.assignTransport(id, body.transportId, req.user);
  }

  @Post(':id/pickup')
  @Roles('TRANSPORT')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @AuditAction('TICKET_START_RIDE')
  @UseInterceptors(AuditInterceptor)
  startRide(@Param('id', ParseObjectIdPipe) id: string, @Request() req: AuthenticatedRequest) {
    return this.svc.startRide(id, req.user);
  }

  @Post(':id/complete')
  @Roles('TRANSPORT')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @AuditAction('TICKET_COMPLETE_RIDE')
  @UseInterceptors(AuditInterceptor)
  completeRide(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() body: CompleteRideDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.svc.completeRide(id, body.otp, req.user);
  }
}
