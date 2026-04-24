import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards, UseInterceptors } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { AuditAction } from '../audit/audit.decorator';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
@Controller('vendor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPERADMIN')
export class VendorsController {
  constructor(private svc: VendorsService) {}
  @Get() findAll() { return this.svc.findAll(); }
  @Get(':id') findOne(@Param('id', ParseObjectIdPipe) id: string) { return this.svc.findOne(id); }
  @Post()
  @AuditAction('VENDOR_CREATE')
  @UseInterceptors(AuditInterceptor)
  create(@Body() data: CreateVendorDto) { return this.svc.create(data); }
  @Put(':id')
  @AuditAction('VENDOR_UPDATE')
  @UseInterceptors(AuditInterceptor)
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() data: UpdateVendorDto) { return this.svc.update(id, data); }
  @Delete(':id')
  @AuditAction('VENDOR_DELETE')
  @UseInterceptors(AuditInterceptor)
  delete(@Param('id', ParseObjectIdPipe) id: string) { return this.svc.delete(id); }
}
