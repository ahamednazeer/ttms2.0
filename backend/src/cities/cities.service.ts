import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { City, CityDocument } from './schemas/city.schema';
import { throwIfDuplicateKey } from '../common/utils/mongo-exception.util';
import { Location, LocationDocument } from '../locations/schemas/location.schema';
import { normalizeRefId, refIdFilter } from '../common/utils/mongo-id.util';
import { getPagination, paginatedResult, PaginationQuery } from '../common/utils/pagination.util';

@Injectable()
export class CitiesService {
  constructor(
    @InjectModel(City.name) private cityModel: Model<CityDocument>,
    @InjectModel(Location.name) private locationModel: Model<LocationDocument>,
  ) {}

  async findAll(query?: PaginationQuery) {
    const { page, limit, skip } = getPagination(query);
    const [cities, total] = await Promise.all([
      this.cityModel.find().sort({ cityName: 1 }).skip(skip).limit(limit).lean().exec(),
      this.cityModel.countDocuments(),
    ]);
    const cityIds = cities.map((city) => city._id);
    const locations = cityIds.length
      ? await this.locationModel.find({ cityId: { $in: cityIds } }).select('locationName cityId').lean().exec()
      : [];

    return paginatedResult(cities.map((city) => ({
      ...city,
      locations: locations.filter((location) => normalizeRefId(location.cityId) === normalizeRefId(city._id)),
    })), total, page, limit);
  }

  async findOne(id: string) {
    const city = await this.cityModel.findById(id).lean().exec();
    if (!city) throw new NotFoundException('City not found');
    const locations = await this.locationModel.find(refIdFilter('cityId', id)).select('locationName cityId').lean().exec();
    return { ...city, locations };
  }

  async create(data: any) {
    try {
      return await new this.cityModel(data).save();
    } catch (error) {
      throwIfDuplicateKey(error, 'City code or city name already exists');
      throw error;
    }
  }

  async update(id: string, data: any) {
    try {
      const city = await this.cityModel.findByIdAndUpdate(id, data, { returnDocument: 'after' });
      if (!city) throw new NotFoundException('City not found');
      return city;
    } catch (error) {
      throwIfDuplicateKey(error, 'City code or city name already exists');
      throw error;
    }
  }

  async delete(id: string) {
    const result = await this.cityModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('City not found');
    return { deleted: true };
  }

  async count() { return this.cityModel.countDocuments(); }
}
