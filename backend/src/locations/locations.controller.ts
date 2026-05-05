import { Body, Controller, Delete, Get, Param, Post, Put, Query, Request, UseGuards, UseInterceptors } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { AuditAction } from '../audit/audit.decorator';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User, UserDocument } from '../users/schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

interface AuthenticatedRequest {
  user: {
    sub: string;
    role: string;
    cityId?: string;
    vendorId?: string;
  };
}

@Controller('location')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LocationsController {
  constructor(
    private svc: LocationsService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  @Get()
  @Roles('SUPERADMIN', 'VENDOR', 'TRANSPORT', 'USER')
  async findAll(@Request() req: AuthenticatedRequest, @Query('cityId') queryCityId?: string) {
    if (req.user.role === 'USER') {
      if (req.user.cityId) {
        return this.svc.findAll(req.user.cityId);
      }

      const user = await this.userModel.findById(req.user.sub).select('cityId vendorId').populate('vendorId').lean() as any;
      const cityId = user?.cityId
        ? String(user.cityId)
        : user?.vendorId?.cityId
          ? String(user.vendorId.cityId)
          : undefined;
      return this.svc.findAll(cityId);
    }
    return this.svc.findAll(queryCityId);
  }

  @Get(':id')
  @Roles('SUPERADMIN', 'VENDOR', 'TRANSPORT', 'USER')
  findOne(@Param('id', ParseObjectIdPipe) id: string) { return this.svc.findOne(id); }

  @Post()
  @Roles('SUPERADMIN')
  @AuditAction('LOCATION_CREATE')
  @UseInterceptors(AuditInterceptor)
  create(@Body() data: CreateLocationDto) { return this.svc.create(data); }

  @Put(':id')
  @Roles('SUPERADMIN')
  @AuditAction('LOCATION_UPDATE')
  @UseInterceptors(AuditInterceptor)
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() data: UpdateLocationDto) { return this.svc.update(id, data); }

  @Delete(':id')
  @Roles('SUPERADMIN')
  @AuditAction('LOCATION_DELETE')
  @UseInterceptors(AuditInterceptor)
  delete(@Param('id', ParseObjectIdPipe) id: string) { return this.svc.delete(id); }
}
