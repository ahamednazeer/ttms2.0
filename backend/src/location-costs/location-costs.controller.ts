import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards, UseInterceptors } from '@nestjs/common';
import { LocationCostsService } from './location-costs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { CreateLocationCostDto } from './dto/create-location-cost.dto';
import { UpdateLocationCostDto } from './dto/update-location-cost.dto';
import { AuditAction } from '../audit/audit.decorator';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('locationcost')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPERADMIN')
export class LocationCostsController {
  constructor(private svc: LocationCostsService) {}
  @Get() findAll() { return this.svc.findAll(); }
  @Get('city/:cityId') findByCity(@Param('cityId', ParseObjectIdPipe) cityId: string) { return this.svc.findByCity(cityId); }
  @Post()
  @AuditAction('LOCATION_COST_CREATE')
  @UseInterceptors(AuditInterceptor)
  create(@Body() data: CreateLocationCostDto) { return this.svc.create(data); }
  @Put(':id')
  @AuditAction('LOCATION_COST_UPDATE')
  @UseInterceptors(AuditInterceptor)
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() data: UpdateLocationCostDto) { return this.svc.update(id, data); }
  @Delete(':id')
  @AuditAction('LOCATION_COST_DELETE')
  @UseInterceptors(AuditInterceptor)
  delete(@Param('id', ParseObjectIdPipe) id: string) { return this.svc.delete(id); }
}
