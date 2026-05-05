import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Location, LocationDocument } from './schemas/location.schema';
import { throwIfDuplicateKey } from '../common/utils/mongo-exception.util';
import { normalizeObjectIdFields, refIdFilter } from '../common/utils/mongo-id.util';

@Injectable()
export class LocationsService {
  constructor(@InjectModel(Location.name) private model: Model<LocationDocument>) {}
  async findAll(cityId?: string) {
    const filter = refIdFilter('cityId', cityId);
    return this.model.find(filter).populate('cityId').exec();
  }
  async findOne(id: string) { const d = await this.model.findById(id).populate('cityId'); if (!d) throw new NotFoundException(); return d; }
  async create(data: any) {
    try {
      return await new this.model(normalizeObjectIdFields(data, ['cityId'])).save();
    } catch (error) {
      throwIfDuplicateKey(error, 'Location already exists for this city');
      throw error;
    }
  }
  async update(id: string, data: any) {
    try {
      const d = await this.model.findByIdAndUpdate(id, normalizeObjectIdFields(data, ['cityId']), { returnDocument: 'after' });
      if (!d) throw new NotFoundException();
      return d;
    } catch (error) {
      throwIfDuplicateKey(error, 'Location already exists for this city');
      throw error;
    }
  }
  async delete(id: string) { const d = await this.model.findByIdAndDelete(id); if (!d) throw new NotFoundException(); return { deleted: true }; }
  async count() { return this.model.countDocuments(); }
}
