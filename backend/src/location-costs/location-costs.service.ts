import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LocationCost, LocationCostDocument } from './schemas/location-cost.schema';
import { throwIfDuplicateKey } from '../common/utils/mongo-exception.util';

@Injectable()
export class LocationCostsService {
  constructor(@InjectModel(LocationCost.name) private model: Model<LocationCostDocument>) {}
  async findAll() { return this.model.find().populate('fromLocationId toLocationId cityId').exec(); }
  async findByCity(cityId: string) { return this.model.find({ cityId }).populate('fromLocationId toLocationId cityId').exec(); }
  async create(data: any) {
    if (data.fromLocationId === data.toLocationId) {
      throw new BadRequestException('From and to locations must be different');
    }
    try {
      return await new this.model(data).save();
    } catch (error) {
      throwIfDuplicateKey(error, 'Location cost already exists for this route');
      throw error;
    }
  }
  async update(id: string, data: any) {
    const current = await this.model.findById(id);
    if (!current) throw new NotFoundException();
    const nextFrom = data.fromLocationId || String(current.fromLocationId);
    const nextTo = data.toLocationId || String(current.toLocationId);
    if (nextFrom === nextTo) {
      throw new BadRequestException('From and to locations must be different');
    }
    try {
      const d = await this.model.findByIdAndUpdate(id, data, { new: true });
      if (!d) throw new NotFoundException();
      return d;
    } catch (error) {
      throwIfDuplicateKey(error, 'Location cost already exists for this route');
      throw error;
    }
  }
  async delete(id: string) { const d = await this.model.findByIdAndDelete(id); if (!d) throw new NotFoundException(); return { deleted: true }; }
  async findCost(fromId: string, toId: string) { return this.model.findOne({ fromLocationId: fromId, toLocationId: toId }); }
}
