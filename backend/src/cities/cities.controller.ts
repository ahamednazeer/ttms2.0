import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards, UseInterceptors } from '@nestjs/common';
import { CitiesService } from './cities.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { AuditAction } from '../audit/audit.decorator';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('city')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPERADMIN')
export class CitiesController {
  constructor(private citiesService: CitiesService) {}

  @Get() findAll() { return this.citiesService.findAll(); }
  @Get(':id') findOne(@Param('id', ParseObjectIdPipe) id: string) { return this.citiesService.findOne(id); }
  @Post()
  @AuditAction('CITY_CREATE')
  @UseInterceptors(AuditInterceptor)
  create(@Body() data: CreateCityDto) { return this.citiesService.create(data); }
  @Put(':id')
  @AuditAction('CITY_UPDATE')
  @UseInterceptors(AuditInterceptor)
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() data: UpdateCityDto) { return this.citiesService.update(id, data); }
  @Delete(':id')
  @AuditAction('CITY_DELETE')
  @UseInterceptors(AuditInterceptor)
  delete(@Param('id', ParseObjectIdPipe) id: string) { return this.citiesService.delete(id); }
}
