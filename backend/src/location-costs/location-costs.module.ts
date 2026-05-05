import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LocationCostsController } from './location-costs.controller';
import { LocationCostsService } from './location-costs.service';
import { LocationCost, LocationCostSchema } from './schemas/location-cost.schema';
import { AuditModule } from '../audit/audit.module';
import { City, CitySchema } from '../cities/schemas/city.schema';
import { Location, LocationSchema } from '../locations/schemas/location.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LocationCost.name, schema: LocationCostSchema },
      { name: City.name, schema: CitySchema },
      { name: Location.name, schema: LocationSchema },
    ]),
    AuditModule,
  ],
  controllers: [LocationCostsController],
  providers: [LocationCostsService],
  exports: [LocationCostsService],
})
export class LocationCostsModule {}
