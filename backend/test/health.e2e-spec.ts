import request from 'supertest';
import { createTestApp, TestApp } from './helpers.js';

describe('Health and errors (e2e)', () => {
  let app: TestApp;

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/health returns ok when the database is up', async () => {
    app = await createTestApp();

    await request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok', database: 'up' });
  });

  it('GET /api/health returns 503 when the database is down', async () => {
    const brokenPrisma = {
      $queryRaw: () => Promise.reject(new Error('connection refused')),
      $extends: () => ({}), // the tenant client is built from it
    };
    app = await createTestApp(brokenPrisma);

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
    app = await createTestApp();

    const res = await request(app.getHttpServer()).get('/api/nope').expect(404);

    expect(res.body).toMatchObject({
      statusCode: 404,
      error: 'NOT_FOUND',
      path: '/api/nope',
    });
    expect(res.body).toHaveProperty('timestamp');
  });

  it('never echoes the query string back in an error', async () => {
    app = await createTestApp();

    const res = await request(app.getHttpServer())
      .get('/api/nope?token=secret')
      .expect(404);

    expect(res.body.message).toBe('Cannot GET /api/nope');
    expect(JSON.stringify(res.body)).not.toContain('secret');
  });
});
