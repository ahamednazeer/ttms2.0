import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET', 'ttms-secret'),
    });
  }

  async validate(payload: any) {
    const user = await this.userModel
      .findById(payload.sub)
      .select('username role cityId vendorId transportId active')
      .populate('cityId vendorId transportId');

    if (!user || user.active === false) {
      throw new UnauthorizedException('User is not active');
    }

    return {
      sub: String(user._id),
      username: user.username,
      role: user.role,
      cityId: user.cityId ? String((user.cityId as any)._id || user.cityId) : undefined,
      vendorId: user.vendorId ? String((user.vendorId as any)._id || user.vendorId) : undefined,
      transportId: user.transportId ? String((user.transportId as any)._id || user.transportId) : undefined,
    };
  }
}
