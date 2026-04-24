import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LocationCostsController } from './location-costs.controller';
import { LocationCostsService } from './location-costs.service';
import { LocationCost, LocationCostSchema } from './schemas/location-cost.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: LocationCost.name, schema: LocationCostSchema }])],
  controllers: [LocationCostsController],
  providers: [LocationCostsService],
  exports: [LocationCostsService],
})
export class LocationCostsModule {}
