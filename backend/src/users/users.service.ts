import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { throwIfDuplicateKey } from '../common/utils/mongo-exception.util';
import { presentUser } from './users.presenter';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private model: Model<UserDocument>,
    private notificationsService: NotificationsService,
  ) {}

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
      const rawPassword = data.password;
      if (data.password) {
        data.password = await bcrypt.hash(data.password, 10);
        data.tokenVersion = 0;
      }
      const created = await new this.model(data).save();
      const hydrated = await created.populate('cityId vendorId transportId');
      this.dispatchNotification(() =>
        this.notificationsService.sendAccountProvisioned(
          {
            email: hydrated.email,
            name: this.getFullName(hydrated.firstName, hydrated.lastName),
            username: hydrated.username,
            role: hydrated.role,
          },
          rawPassword,
        ),
      );
      return presentUser(hydrated.toObject());
    } catch (error) {
      throwIfDuplicateKey(error, 'Username or email already exists');
      throw error;
    }
  }

  async update(id: string, data: any) {
    try {
      const previous = await this.model.findById(id).select('-password').lean();
      if (!previous) throw new NotFoundException();

      const rawPassword = data.password;
      if (data.password) {
        data.password = await bcrypt.hash(data.password, 10);
        data.tokenVersion = (previous.tokenVersion || 0) + 1;
      }
      else delete data.password;

      if (data.role && data.role !== 'TRANSPORT') {
        delete data.transportId;
      }
      if (data.role && data.role !== 'VENDOR') {
        delete data.vendorId;
      }

      const d = await this.model.findByIdAndUpdate(id, data, { new: true }).select('-password').populate('cityId vendorId transportId');
      if (!d) throw new NotFoundException();
      const changeSummary = this.buildChangeSummary(previous, d.toObject(), !!rawPassword);
      this.dispatchNotification(() =>
        this.notificationsService.sendAccountUpdated(
          {
            email: d.email,
            name: this.getFullName(d.firstName, d.lastName),
            username: d.username,
          },
          changeSummary,
        ),
      );
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

  private buildChangeSummary(previous: any, current: any, passwordChanged: boolean) {
    const changes: string[] = [];
    if (passwordChanged) changes.push('Password was updated.');
    if (previous.role !== current.role) changes.push(`Role changed from ${previous.role} to ${current.role}.`);
    if ((previous.email || '') !== (current.email || '')) changes.push(`Email updated to ${current.email || 'not set'}.`);
    if ((previous.phone || '') !== (current.phone || '')) changes.push(`Phone updated to ${current.phone || 'not set'}.`);
    if (String(previous.cityId || '') !== String(current.cityId?._id || current.cityId || '')) changes.push('City assignment was updated.');
    return changes;
  }

  private getFullName(firstName?: string, lastName?: string) {
    return [firstName, lastName].filter(Boolean).join(' ').trim() || undefined;
  }

  private dispatchNotification(task: () => Promise<unknown>) {
    void task().catch(() => undefined);
  }
}
