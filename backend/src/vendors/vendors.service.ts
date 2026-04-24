import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Vendor, VendorDocument } from './schemas/vendor.schema';
import { throwIfDuplicateKey } from '../common/utils/mongo-exception.util';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class VendorsService {
  constructor(
    @InjectModel(Vendor.name) private model: Model<VendorDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}
  async findAll(actor?: { role: string; vendorId?: string }) {
    const filter: Record<string, unknown> = {};
    if (actor?.role === 'VENDOR') {
      if (!actor.vendorId) return [];
      filter._id = actor.vendorId;
    }
    return this.model.find(filter).populate('cityId').exec();
  }
  async findOne(id: string, actor?: { role: string; vendorId?: string }) {
    const d = await this.model.findById(id).populate('cityId');
    if (!d) throw new NotFoundException();
    if (actor?.role === 'VENDOR' && String(d._id) !== actor.vendorId) {
      throw new ForbiddenException('Cannot access vendors outside your scope');
    }
    return d;
  }
  async create(data: any) {
    try {
      const { userId, ...vendorData } = data;
      const created = await new this.model(vendorData).save();
      await this.syncVendorUser(String(created._id), userId);
      return this.findOne(String(created._id));
    } catch (error) {
      throwIfDuplicateKey(error, 'Vendor name or email already exists');
      throw error;
    }
  }
  async update(id: string, data: any) {
    try {
      const { userId, ...vendorData } = data;
      const d = await this.model.findByIdAndUpdate(id, vendorData, { new: true });
      if (!d) throw new NotFoundException();
      if (Object.prototype.hasOwnProperty.call(data, 'userId')) {
        await this.syncVendorUser(id, userId);
      }
      return this.findOne(id);
    } catch (error) {
      throwIfDuplicateKey(error, 'Vendor name or email already exists');
      throw error;
    }
  }
  async delete(id: string) {
    const d = await this.model.findByIdAndDelete(id);
    if (!d) throw new NotFoundException();
    await this.userModel.updateMany({ vendorId: id }, { $unset: { vendorId: 1 } });
    return { deleted: true };
  }
  async count() { return this.model.countDocuments(); }

  private async syncVendorUser(vendorId: string, userId?: string) {
    await this.userModel.updateMany({ vendorId }, { $unset: { vendorId: 1 } });

    if (!userId) return;

    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('Linked vendor user not found');
    if (user.role !== 'VENDOR') {
      throw new BadRequestException('Linked user must have VENDOR role');
    }

    if (user.vendorId) {
      await this.userModel.updateMany(
        { _id: { $ne: user._id }, vendorId: user.vendorId },
        { $unset: { vendorId: 1 } },
      );
    }

    user.vendorId = vendorId as any;
    await user.save();
  }
}
