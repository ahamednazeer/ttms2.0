import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransportsController } from './transports.controller';
import { TransportsService } from './transports.service';
import { Transport, TransportSchema } from './schemas/transport.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { AuditModule } from '../audit/audit.module';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transport.name, schema: TransportSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuditModule,
  ],
  controllers: [TransportsController], providers: [TransportsService], exports: [TransportsService],
})
export class TransportsModule {}
