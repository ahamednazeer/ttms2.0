import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards, UseInterceptors } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { AuditAction } from '../audit/audit.decorator';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('location')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPERADMIN')
export class LocationsController {
  constructor(private svc: LocationsService) {}
  @Get() findAll() { return this.svc.findAll(); }
  @Get(':id') findOne(@Param('id', ParseObjectIdPipe) id: string) { return this.svc.findOne(id); }
  @Post()
  @AuditAction('LOCATION_CREATE')
  @UseInterceptors(AuditInterceptor)
  create(@Body() data: CreateLocationDto) { return this.svc.create(data); }
  @Put(':id')
  @AuditAction('LOCATION_UPDATE')
  @UseInterceptors(AuditInterceptor)
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() data: UpdateLocationDto) { return this.svc.update(id, data); }
  @Delete(':id')
  @AuditAction('LOCATION_DELETE')
  @UseInterceptors(AuditInterceptor)
  delete(@Param('id', ParseObjectIdPipe) id: string) { return this.svc.delete(id); }
}
