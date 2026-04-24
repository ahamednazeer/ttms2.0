import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransportsController } from './transports.controller';
import { TransportsService } from './transports.service';
import { Transport, TransportSchema } from './schemas/transport.schema';
@Module({
  imports: [MongooseModule.forFeature([{ name: Transport.name, schema: TransportSchema }])],
  controllers: [TransportsController], providers: [TransportsService], exports: [TransportsService],
})
export class TransportsModule {}
