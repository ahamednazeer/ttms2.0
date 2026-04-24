import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
@Controller('user')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private svc: UsersService) {}
  @Get() findAll() { return this.svc.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Post() create(@Body() data: any) { return this.svc.create(data); }
  @Put(':id') update(@Param('id') id: string, @Body() data: any) { return this.svc.update(id, data); }
  @Delete(':id') delete(@Param('id') id: string) { return this.svc.delete(id); }
}
