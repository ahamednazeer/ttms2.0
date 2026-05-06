import { Controller, Post, Body, Get, UseGuards, Request, UseInterceptors, Res, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuditAction } from '../audit/audit.decorator';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { Throttle } from '@nestjs/throttler';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import type { Response } from 'express';
import { clearAuthCookie, setAuthCookie } from './auth-cookie.util';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('sign-in')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @AuditAction('AUTH_SIGN_IN')
  @UseInterceptors(AuditInterceptor)
  async signIn(@Body() body: { username: string; password: string }, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.signIn(body.username, body.password);
    setAuthCookie(res, result.token);
    return {
      user: result.user,
    };
  }

  @Post('sign-out')
  @HttpCode(204)
  signOut(@Res({ passthrough: true }) res: Response) {
    clearAuthCookie(res);
  }

  @Post('request-password-reset')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async requestPasswordReset(@Body() body: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(body.identifier);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.token, body.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req: any) {
    return this.authService.getMe(req.user.sub);
  }
}
