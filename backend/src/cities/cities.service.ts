import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { City, CityDocument } from './schemas/city.schema';
import { throwIfDuplicateKey } from '../common/utils/mongo-exception.util';
import { Location, LocationDocument } from '../locations/schemas/location.schema';

@Injectable()
export class CitiesService {
  constructor(
    @InjectModel(City.name) private cityModel: Model<CityDocument>,
    @InjectModel(Location.name) private locationModel: Model<LocationDocument>,
  ) {}

  async findAll() {
    const [cities, locations] = await Promise.all([
      this.cityModel.find().lean().exec(),
      this.locationModel.find().select('locationName cityId').lean().exec(),
    ]);

    return cities.map((city) => ({
      ...city,
      locations: locations.filter((location) => String(location.cityId) === String(city._id)),
    }));
  }

  async findOne(id: string) {
    const city = await this.cityModel.findById(id).lean().exec();
    if (!city) throw new NotFoundException('City not found');
    const locations = await this.locationModel.find({ cityId: id }).select('locationName cityId').lean().exec();
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
      const city = await this.cityModel.findByIdAndUpdate(id, data, { new: true });
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
