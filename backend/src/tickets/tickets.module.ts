import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { Ticket, TicketSchema } from './schemas/ticket.schema';
import { LocationCostsModule } from '../location-costs/location-costs.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { Transport, TransportSchema } from '../transports/schemas/transport.schema';
import { Location, LocationSchema } from '../locations/schemas/location.schema';
import { AuditModule } from '../audit/audit.module';
import { Vendor, VendorSchema } from '../vendors/schemas/vendor.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ticket.name, schema: TicketSchema },
      { name: Transport.name, schema: TransportSchema },
      { name: Location.name, schema: LocationSchema },
      { name: Vendor.name, schema: VendorSchema },
      { name: User.name, schema: UserSchema },
    ]),
    LocationCostsModule,
    RealtimeModule,
    AuditModule,
    NotificationsModule,
  ],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
