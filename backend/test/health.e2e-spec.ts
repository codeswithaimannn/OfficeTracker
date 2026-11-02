import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

// Starts the real app (with the real local database) and sends HTTP
// requests to it.
async function createApp(
  prismaOverride?: object,
): Promise<INestApplication<App>> {
  const builder = Test.createTestingModule({ imports: [AppModule] });
  if (prismaOverride) {
    builder.overrideProvider(PrismaService).useValue(prismaOverride);
  }
  const moduleRef = await builder.compile();
  const app = moduleRef.createNestApplication<INestApplication<App>>();
  configureApp(app);
  await app.init();
  return app;
}

describe('Health and errors (e2e)', () => {
  let app: INestApplication<App>;

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/health returns ok when the database is up', async () => {
    app = await createApp();

    await request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok', database: 'up' });
  });

  it('GET /api/health returns 503 when the database is down', async () => {
    const brokenPrisma = {
      $queryRaw: () => Promise.reject(new Error('connection refused')),
    };
    app = await createApp(brokenPrisma);

    const res = await request(app.getHttpServer())
      .get('/api/health')
      .expect(503);

    expect(res.body).toMatchObject({
      statusCode: 503,
      error: 'SERVICE_UNAVAILABLE',
      message: 'Database is not reachable',
      path: '/api/health',
    });
  });

  it('an unknown route returns 404 in the standard error format', async () => {
    app = await createApp();

    const res = await request(app.getHttpServer()).get('/api/nope').expect(404);

    expect(res.body).toMatchObject({
      statusCode: 404,
      error: 'NOT_FOUND',
      path: '/api/nope',
    });
    expect(res.body).toHaveProperty('timestamp');
  });

  it('never echoes the query string back in an error', async () => {
    app = await createApp();

    const res = await request(app.getHttpServer())
      .get('/api/nope?token=secret')
      .expect(404);

    expect(res.body.message).toBe('Cannot GET /api/nope');
    expect(JSON.stringify(res.body)).not.toContain('secret');
  });
});
