import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

interface AuthenticatedRequest {
  user: {
    role: string;
    vendorId?: string;
  };
}

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private svc: DashboardService) {}

  @Get()
  @Roles('SUPERADMIN', 'VENDOR')
  getStats(@Request() req: AuthenticatedRequest) { return this.svc.getStats(req.user); }
}
