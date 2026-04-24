import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private model: Model<UserDocument>) {}

  async findAll() { return this.model.find().select('-password').populate('cityId vendorId transportId').exec(); }

  async findOne(id: string) {
    const d = await this.model.findById(id).select('-password').populate('cityId vendorId transportId');
    if (!d) throw new NotFoundException();
    return d;
  }

  async create(data: any) {
    if (data.password) data.password = await bcrypt.hash(data.password, 10);
    return new this.model(data).save();
  }

  async update(id: string, data: any) {
    if (data.password) data.password = await bcrypt.hash(data.password, 10);
    else delete data.password;
    const d = await this.model.findByIdAndUpdate(id, data, { new: true }).select('-password');
    if (!d) throw new NotFoundException();
    return d;
  }

  async delete(id: string) {
    const d = await this.model.findByIdAndDelete(id);
    if (!d) throw new NotFoundException();
    return { deleted: true };
  }

  async count() { return this.model.countDocuments(); }
}
