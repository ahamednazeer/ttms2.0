import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { CitiesModule } from './cities/cities.module';
import { LocationsModule } from './locations/locations.module';
import { LocationCostsModule } from './location-costs/location-costs.module';
import { VendorsModule } from './vendors/vendors.module';
import { UsersModule } from './users/users.module';
import { TransportsModule } from './transports/transports.module';
import { TicketsModule } from './tickets/tickets.module';
import { InvoicesModule } from './invoices/invoices.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { RealtimeModule } from './realtime/realtime.module';
import { AuditModule } from './audit/audit.module';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

const isProduction = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120,
      },
    ]),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/ttms'),
    AuthModule,
    AuditModule,
    CitiesModule,
    LocationsModule,
    LocationCostsModule,
    VendorsModule,
    UsersModule,
    TransportsModule,
    RealtimeModule,
    TicketsModule,
    InvoicesModule,
    DashboardModule,
  ],
  providers: [
    ...(isProduction
      ? [
          {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
          },
        ]
      : []),
  ],
})
export class AppModule {}
