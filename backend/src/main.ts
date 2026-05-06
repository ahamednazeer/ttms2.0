import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import type { NextFunction, Request, Response } from 'express';

function getAllowedOrigins() {
  const configuredOrigins = process.env.CORS_ORIGINS || process.env.FRONTEND_URL || process.env.APP_BASE_URL;
  if (!configuredOrigins && process.env.NODE_ENV === 'production') {
    throw new Error('Set CORS_ORIGINS, FRONTEND_URL, or APP_BASE_URL in production');
  }

  return (configuredOrigins || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function parseHosts(value?: string) {
  return new Set(
    (value || '')
      .split(',')
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean),
  );
}

function hostname(req: Request) {
  return String(req.headers['x-forwarded-host'] || req.headers.host || '')
    .split(',')[0]
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, '');
}

function useHostRouteRestrictions(app: Awaited<ReturnType<typeof NestFactory.create>>) {
  const authHosts = parseHosts(process.env.AUTH_HOSTS || process.env.AUTH_HOST);
  const apiHosts = parseHosts(process.env.API_HOSTS || process.env.API_HOST);

  if (!authHosts.size && !apiHosts.size) return;

  app.use((req: Request, res: Response, next: NextFunction) => {
    const host = hostname(req);
    const path = req.path || req.url;
    const isAuthPath = path === '/auth' || path.startsWith('/auth/');

    if (authHosts.has(host) && !isAuthPath) {
      res.status(404).json({ message: 'Not found' });
      return;
    }

    if (apiHosts.has(host) && isAuthPath) {
      res.status(404).json({ message: 'Not found' });
      return;
    }

    next();
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = getAllowedOrigins();

  useHostRouteRestrictions(app);
  
  app.enableCors({
    origin(origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origin is not allowed by CORS'), false);
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 8000;
  await app.listen(port);
  console.log(`🚀 TTMS Backend running on http://localhost:${port}`);
}
bootstrap();
