import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
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
    return user;
  }
}
