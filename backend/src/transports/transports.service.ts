import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transport, TransportDocument } from './schemas/transport.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { throwIfDuplicateKey } from '../common/utils/mongo-exception.util';

@Injectable()
export class TransportsService {
  constructor(
    @InjectModel(Transport.name) private model: Model<TransportDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}
  async findAll(actor?: { role: string; vendorId?: string }) {
    const filter: Record<string, unknown> = {};
    if (actor?.role === 'VENDOR') {
      if (!actor.vendorId) return [];
      filter.vendorId = actor.vendorId;
    }
    return this.model.find(filter).populate('vendorId cityId').exec();
  }
  async findOne(id: string, actor?: { role: string; vendorId?: string }) {
    const d = await this.model.findById(id).populate('vendorId cityId');
    if (!d) throw new NotFoundException();
    if (actor?.role === 'VENDOR' && String((d.vendorId as any)?._id || d.vendorId) !== actor.vendorId) {
      throw new ForbiddenException('Cannot access transports outside your vendor scope');
    }
    return d;
  }
  async create(data: any) {
    try {
      const { userId, ...transportData } = data;
      const created = await new this.model(transportData).save();
      await this.syncTransportUser(String(created._id), userId);
      return this.findOne(String(created._id));
    } catch (error) {
      throwIfDuplicateKey(error, 'Vehicle number must be unique');
      throw error;
    }
  }
  async update(id: string, data: any) {
    try {
      const { userId, ...transportData } = data;
      const d = await this.model.findByIdAndUpdate(id, transportData, { new: true });
      if (!d) throw new NotFoundException();
      if (Object.prototype.hasOwnProperty.call(data, 'userId')) {
        await this.syncTransportUser(id, userId);
      }
      return this.findOne(id);
    } catch (error) {
      throwIfDuplicateKey(error, 'Vehicle number must be unique');
      throw error;
    }
  }
  async createForActor(data: any, actor: { role: string; vendorId?: string }) {
    if (actor.role === 'VENDOR') {
      if (!actor.vendorId) {
        throw new ForbiddenException('Vendor access is not configured');
      }
      return this.create({ ...data, vendorId: actor.vendorId });
    }
    return this.create(data);
  }
  async updateForActor(id: string, data: any, actor: { role: string; vendorId?: string }) {
    const existing = await this.findOne(id, actor);
    if (actor.role === 'VENDOR') {
      return this.update(id, { ...data, vendorId: String((existing.vendorId as any)?._id || existing.vendorId || actor.vendorId) });
    }
    return this.update(id, data);
  }
  async deleteForActor(id: string, actor: { role: string; vendorId?: string }) {
    await this.findOne(id, actor);
    return this.delete(id);
  }
  async delete(id: string) {
    const d = await this.model.findByIdAndDelete(id);
    if (!d) throw new NotFoundException();
    await this.userModel.updateMany({ transportId: id }, { $unset: { transportId: 1 } });
    return { deleted: true };
  }
  async count(filter?: Record<string, unknown>) { return this.model.countDocuments(filter || {}); }

  private async syncTransportUser(transportId: string, userId?: string) {
    await this.userModel.updateMany({ transportId }, { $unset: { transportId: 1 } });

    if (!userId) return;

    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Linked transport user not found');
    if (user.role !== 'TRANSPORT') {
      throw new BadRequestException('Linked user must have TRANSPORT role');
    }

    if (user.transportId) {
      await this.userModel.updateMany(
        { _id: { $ne: user._id }, transportId: user.transportId },
        { $unset: { transportId: 1 } },
      );
    }

    user.transportId = transportId as any;
    await user.save();
  }
}
