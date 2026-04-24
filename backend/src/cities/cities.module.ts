import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CitiesController } from './cities.controller';
import { CitiesService } from './cities.service';
import { City, CitySchema } from './schemas/city.schema';
import { Location, LocationSchema } from '../locations/schemas/location.schema';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: City.name, schema: CitySchema },
      { name: Location.name, schema: LocationSchema },
    ]),
    AuditModule,
  ],
  controllers: [CitiesController],
  providers: [CitiesService],
  exports: [CitiesService],
})
export class CitiesModule {}
