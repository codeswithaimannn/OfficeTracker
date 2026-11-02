import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from './common/http-exception.filter.js';

// App-wide settings, shared by main.ts and the e2e tests so both run the
// app the same way.
export function configureApp(app: INestApplication): void {
  // All routes live under /api, e.g. GET /api/health.
  app.setGlobalPrefix('api');
  // Makes request.cookies available (the login token lives in a cookie).
  app.use(cookieParser());
  // Checks every request body against its DTO class. Unknown fields are
  // rejected, and values are converted (e.g. emails trimmed).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();
}
