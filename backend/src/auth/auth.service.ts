import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { presentUser } from '../users/users.presenter';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
  ) {
    this.seedDefaultUsers();
  }

  private async seedDefaultUsers() {
    const count = await this.userModel.countDocuments();
    if (count === 0) {
      const users = [
        { username: 'admin', password: await bcrypt.hash('admin123', 10), role: 'SUPERADMIN', firstName: 'Super', lastName: 'Admin', email: 'admin@ttms.gov' },
        { username: 'vendor1', password: await bcrypt.hash('vendor123', 10), role: 'VENDOR', firstName: 'John', lastName: 'Vendor', email: 'vendor@ttms.gov' },
        { username: 'driver1', password: await bcrypt.hash('driver123', 10), role: 'TRANSPORT', firstName: 'Mike', lastName: 'Driver', email: 'driver@ttms.gov' },
        { username: 'user1', password: await bcrypt.hash('user123', 10), role: 'USER', firstName: 'Jane', lastName: 'Citizen', email: 'user@ttms.gov' },
      ];
      await this.userModel.insertMany(users);
      console.log('✅ Default users seeded');
    }
  }

  async signIn(username: string, password: string) {
    const user = await this.userModel.findOne({ username }).populate('cityId vendorId transportId');
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const payload = {
      sub: String(user._id),
      username: user.username,
      role: user.role,
      cityId: user.cityId ? String(user.cityId._id || user.cityId) : undefined,
      vendorId: user.vendorId ? String(user.vendorId._id || user.vendorId) : undefined,
      transportId: user.transportId ? String(user.transportId._id || user.transportId) : undefined,
      tokenVersion: user.tokenVersion || 0,
    };
    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    };
  }

  async getMe(userId: string) {
    const user = await this.userModel.findById(userId).select('-password').populate('cityId vendorId transportId');
    if (!user) throw new UnauthorizedException('User not found');
    return presentUser(user.toObject());
  }

  async requestPasswordReset(identifier: string) {
    const user = await this.userModel
      .findOne({
        $or: [
          { username: identifier },
          { email: identifier },
        ],
      })
      .select('+passwordResetToken +passwordResetExpiresAt');

    if (user?.email) {
      const token = randomBytes(32).toString('hex');
      user.passwordResetToken = this.hashResetToken(token);
      user.passwordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
      await user.save();
      void this.notificationsService.sendPasswordReset(
        {
          email: user.email,
          name: [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || undefined,
        },
        token,
      ).catch(() => undefined);
    }

    return {
      message: 'If an account matches that username or email, password reset instructions have been sent.',
    };
  }

  async resetPassword(token: string, password: string) {
    const user = await this.userModel
      .findOne({
        passwordResetToken: this.hashResetToken(token),
        passwordResetExpiresAt: { $gt: new Date() },
      })
      .select('+passwordResetToken +passwordResetExpiresAt');

    if (!user) {
      throw new BadRequestException('Reset link is invalid or has expired');
    }

    user.password = await bcrypt.hash(password, 10);
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.passwordResetToken = undefined as any;
    user.passwordResetExpiresAt = undefined as any;
    await user.save();

    void this.notificationsService.sendAccountUpdated(
      {
        email: user.email,
        name: [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || undefined,
        username: user.username,
      },
      ['Password was updated through the account recovery flow.'],
    ).catch(() => undefined);

    return {
      message: 'Password reset successful. You can now sign in with your new password.',
    };
  }

  private hashResetToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
