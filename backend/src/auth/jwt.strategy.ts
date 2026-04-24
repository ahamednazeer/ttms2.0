import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET', 'ttms-secret'),
    });
  }

  async validate(payload: any) {
    return {
      sub: payload.sub,
      username: payload.username,
      role: payload.role,
      cityId: payload.cityId,
      vendorId: payload.vendorId,
      transportId: payload.transportId,
    };
  }
}
