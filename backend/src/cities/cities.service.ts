import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { City, CityDocument } from './schemas/city.schema';

@Injectable()
export class CitiesService {
  constructor(@InjectModel(City.name) private cityModel: Model<CityDocument>) {}

  async findAll() { return this.cityModel.find().exec(); }

  async findOne(id: string) {
    const city = await this.cityModel.findById(id);
    if (!city) throw new NotFoundException('City not found');
    return city;
  }

  async create(data: any) { return new this.cityModel(data).save(); }

  async update(id: string, data: any) {
    const city = await this.cityModel.findByIdAndUpdate(id, data, { new: true });
    if (!city) throw new NotFoundException('City not found');
    return city;
  }

  async delete(id: string) {
    const result = await this.cityModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('City not found');
    return { deleted: true };
  }

  async count() { return this.cityModel.countDocuments(); }
}
