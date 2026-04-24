import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { CitiesModule } from '../cities/cities.module';
import { LocationsModule } from '../locations/locations.module';
import { VendorsModule } from '../vendors/vendors.module';
import { UsersModule } from '../users/users.module';
import { TransportsModule } from '../transports/transports.module';
import { TicketsModule } from '../tickets/tickets.module';

@Module({
  imports: [CitiesModule, LocationsModule, VendorsModule, UsersModule, TransportsModule, TicketsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
