import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { CitiesService } from './cities.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('city')
@UseGuards(JwtAuthGuard)
export class CitiesController {
  constructor(private citiesService: CitiesService) {}

  @Get() findAll() { return this.citiesService.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.citiesService.findOne(id); }
  @Post() create(@Body() data: any) { return this.citiesService.create(data); }
  @Put(':id') update(@Param('id') id: string, @Body() data: any) { return this.citiesService.update(id, data); }
  @Delete(':id') delete(@Param('id') id: string) { return this.citiesService.delete(id); }
}
