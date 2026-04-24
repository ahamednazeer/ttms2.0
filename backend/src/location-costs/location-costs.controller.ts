import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { LocationCostsService } from './location-costs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('locationcost')
@UseGuards(JwtAuthGuard)
export class LocationCostsController {
  constructor(private svc: LocationCostsService) {}
  @Get() findAll() { return this.svc.findAll(); }
  @Get('city/:cityId') findByCity(@Param('cityId') cityId: string) { return this.svc.findByCity(cityId); }
  @Post() create(@Body() data: any) { return this.svc.create(data); }
  @Put(':id') update(@Param('id') id: string, @Body() data: any) { return this.svc.update(id, data); }
  @Delete(':id') delete(@Param('id') id: string) { return this.svc.delete(id); }
}
