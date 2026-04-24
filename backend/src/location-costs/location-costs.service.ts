import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LocationCost, LocationCostDocument } from './schemas/location-cost.schema';

@Injectable()
export class LocationCostsService {
  constructor(@InjectModel(LocationCost.name) private model: Model<LocationCostDocument>) {}
  async findAll() { return this.model.find().populate('fromLocationId toLocationId cityId').exec(); }
  async findByCity(cityId: string) { return this.model.find({ cityId }).populate('fromLocationId toLocationId cityId').exec(); }
  async create(data: any) { return new this.model(data).save(); }
  async update(id: string, data: any) { const d = await this.model.findByIdAndUpdate(id, data, { new: true }); if (!d) throw new NotFoundException(); return d; }
  async delete(id: string) { const d = await this.model.findByIdAndDelete(id); if (!d) throw new NotFoundException(); return { deleted: true }; }
  async findCost(fromId: string, toId: string) { return this.model.findOne({ fromLocationId: fromId, toLocationId: toId }); }
}
