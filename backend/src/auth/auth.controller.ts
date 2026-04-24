import { Controller, Post, Body, Get, UseGuards, Request, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuditAction } from '../audit/audit.decorator';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('sign-in')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @AuditAction('AUTH_SIGN_IN')
  @UseInterceptors(AuditInterceptor)
  async signIn(@Body() body: { username: string; password: string }) {
    return this.authService.signIn(body.username, body.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req: any) {
    return this.authService.getMe(req.user.sub);
  }
}
