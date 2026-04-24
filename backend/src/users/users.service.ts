import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { throwIfDuplicateKey } from '../common/utils/mongo-exception.util';
import { presentUser } from './users.presenter';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private model: Model<UserDocument>) {}

  async findAll() {
    const users = await this.model.find().select('-password').populate('cityId vendorId transportId').exec();
    return users.map((user) => presentUser(user.toObject()));
  }

  async findOne(id: string) {
    const d = await this.model.findById(id).select('-password').populate('cityId vendorId transportId');
    if (!d) throw new NotFoundException();
    return presentUser(d.toObject());
  }

  async create(data: any) {
    try {
      if (data.password) data.password = await bcrypt.hash(data.password, 10);
      const created = await new this.model(data).save();
      const hydrated = await created.populate('cityId vendorId transportId');
      return presentUser(hydrated.toObject());
    } catch (error) {
      throwIfDuplicateKey(error, 'Username or email already exists');
      throw error;
    }
  }

  async update(id: string, data: any) {
    try {
      if (data.password) data.password = await bcrypt.hash(data.password, 10);
      else delete data.password;

      if (data.role && data.role !== 'TRANSPORT') {
        delete data.transportId;
      }
      if (data.role && data.role !== 'VENDOR') {
        delete data.vendorId;
      }

      const d = await this.model.findByIdAndUpdate(id, data, { new: true }).select('-password').populate('cityId vendorId transportId');
      if (!d) throw new NotFoundException();
      return presentUser(d.toObject());
    } catch (error) {
      throwIfDuplicateKey(error, 'Username or email already exists');
      throw error;
    }
  }

  async delete(id: string) {
    const d = await this.model.findByIdAndDelete(id);
    if (!d) throw new NotFoundException();
    return { deleted: true };
  }

  async count() { return this.model.countDocuments(); }
}
