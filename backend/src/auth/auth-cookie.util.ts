import type { Request, Response } from 'express';
import type { CookieOptions } from 'express';

export const AUTH_COOKIE_NAME = 'ttms_access_token';

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function getJwtSecret(value?: string) {
  if (!value || value.trim().length < 32) {
    throw new Error('JWT_SECRET must be set to a strong value of at least 32 characters');
  }
  return value;
}

function cookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  const sameSite = (process.env.AUTH_COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax')) as CookieOptions['sameSite'];

  return {
    httpOnly: true,
    secure: isProduction || sameSite === 'none',
    sameSite,
    domain: process.env.AUTH_COOKIE_DOMAIN || undefined,
    path: '/',
  };
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie(AUTH_COOKIE_NAME, token, {
    ...cookieOptions(),
    maxAge: MAX_AGE_MS,
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(AUTH_COOKIE_NAME, {
    ...cookieOptions(),
  });
}

export function extractJwtFromCookie(req?: Request) {
  const cookieHeader = req?.headers?.cookie;
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
  const authCookie = cookies.find((cookie) => cookie.startsWith(`${AUTH_COOKIE_NAME}=`));
  if (!authCookie) return null;

  return decodeURIComponent(authCookie.slice(AUTH_COOKIE_NAME.length + 1));
}
