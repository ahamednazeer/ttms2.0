import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards, UseInterceptors } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuditAction } from '../audit/audit.decorator';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
@Controller('user')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPERADMIN')
export class UsersController {
  constructor(private svc: UsersService) {}
  @Get() findAll() { return this.svc.findAll(); }
  @Get(':id') findOne(@Param('id', ParseObjectIdPipe) id: string) { return this.svc.findOne(id); }
  @Post()
  @AuditAction('USER_CREATE')
  @UseInterceptors(AuditInterceptor)
  create(@Body() data: CreateUserDto) { return this.svc.create(data); }
  @Put(':id')
  @AuditAction('USER_UPDATE')
  @UseInterceptors(AuditInterceptor)
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() data: UpdateUserDto) { return this.svc.update(id, data); }
  @Delete(':id')
  @AuditAction('USER_DELETE')
  @UseInterceptors(AuditInterceptor)
  delete(@Param('id', ParseObjectIdPipe) id: string) { return this.svc.delete(id); }
}
