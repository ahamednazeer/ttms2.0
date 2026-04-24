import { Body, Controller, Delete, Get, Param, Post, Put, Request, UseGuards, UseInterceptors } from '@nestjs/common';
import { TransportsService } from './transports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { CreateTransportDto } from './dto/create-transport.dto';
import { UpdateTransportDto } from './dto/update-transport.dto';
import { AuditAction } from '../audit/audit.decorator';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

interface AuthenticatedRequest {
  user: {
    role: string;
    vendorId?: string;
  };
}
@Controller('transport')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransportsController {
  constructor(private svc: TransportsService) {}
  @Get()
  @Roles('SUPERADMIN', 'VENDOR')
  findAll(@Request() req: AuthenticatedRequest) { return this.svc.findAll(req.user); }
  @Get(':id')
  @Roles('SUPERADMIN', 'VENDOR')
  findOne(@Param('id', ParseObjectIdPipe) id: string, @Request() req: AuthenticatedRequest) { return this.svc.findOne(id, req.user); }
  @Post()
  @Roles('SUPERADMIN', 'VENDOR')
  @AuditAction('TRANSPORT_CREATE')
  @UseInterceptors(AuditInterceptor)
  create(@Body() data: CreateTransportDto, @Request() req: AuthenticatedRequest) { return this.svc.createForActor(data, req.user); }
  @Put(':id')
  @Roles('SUPERADMIN', 'VENDOR')
  @AuditAction('TRANSPORT_UPDATE')
  @UseInterceptors(AuditInterceptor)
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() data: UpdateTransportDto, @Request() req: AuthenticatedRequest) { return this.svc.updateForActor(id, data, req.user); }
  @Delete(':id')
  @Roles('SUPERADMIN', 'VENDOR')
  @AuditAction('TRANSPORT_DELETE')
  @UseInterceptors(AuditInterceptor)
  delete(@Param('id', ParseObjectIdPipe) id: string, @Request() req: AuthenticatedRequest) { return this.svc.deleteForActor(id, req.user); }
}
