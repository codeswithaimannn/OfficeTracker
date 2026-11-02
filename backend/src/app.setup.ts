import { INestApplication } from '@nestjs/common';
import { AllExceptionsFilter } from './common/http-exception.filter.js';

// App-wide settings, shared by main.ts and the e2e tests so both run the
// app the same way.
export function configureApp(app: INestApplication): void {
  // All routes live under /api, e.g. GET /api/health.
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();
}
