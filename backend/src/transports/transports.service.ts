import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transport, TransportDocument } from './schemas/transport.schema';

@Injectable()
export class TransportsService {
  constructor(@InjectModel(Transport.name) private model: Model<TransportDocument>) {}
  async findAll() { return this.model.find().populate('vendorId cityId').exec(); }
  async findOne(id: string) { const d = await this.model.findById(id).populate('vendorId cityId'); if (!d) throw new NotFoundException(); return d; }
  async create(data: any) { return new this.model(data).save(); }
  async update(id: string, data: any) { const d = await this.model.findByIdAndUpdate(id, data, { new: true }); if (!d) throw new NotFoundException(); return d; }
  async delete(id: string) { const d = await this.model.findByIdAndDelete(id); if (!d) throw new NotFoundException(); return { deleted: true }; }
  async count() { return this.model.countDocuments(); }
}
