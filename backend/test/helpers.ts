import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { assertTestDatabase } from './test-database.js';

export type TestApp = INestApplication<App>;

// Starts the real app with the same setup as main.ts. Optionally swaps
// PrismaService for a fake (e.g. a database that is down).
export async function createTestApp(prismaOverride?: object): Promise<TestApp> {
  const builder = Test.createTestingModule({ imports: [AppModule] });
  if (prismaOverride) {
    builder.overrideProvider(PrismaService).useValue(prismaOverride);
  }
  const moduleRef = await builder.compile();
  const app = moduleRef.createNestApplication<TestApp>();
  configureApp(app);
  await app.init();
  return app;
}

// Empties every table, so each test starts from a clean database.
export async function resetDatabase(app: TestApp): Promise<void> {
  assertTestDatabase();
  await app.get(PrismaService)
    .$executeRaw`TRUNCATE TABLE "users", "departments", "organizations" CASCADE`;
}

export interface SignedUpUser {
  cookie: string;
  body: {
    id: string;
    email: string;
    role: string;
    organization: { id: string; name: string };
  };
}

// Signs up a new organisation and returns its admin's login cookie.
export async function signUp(
  app: TestApp,
  organizationName: string,
  email: string,
  password = 'correct-horse-1',
): Promise<SignedUpUser> {
  const res = await request(app.getHttpServer())
    .post('/api/auth/signup')
    .send({ organizationName, name: 'Test Admin', email, password })
    .expect(201);
  return { cookie: sessionCookie(res.headers['set-cookie']), body: res.body };
}

// Picks our session cookie ("name=value") out of a Set-Cookie header.
export function sessionCookie(
  setCookie: string | string[] | undefined,
): string {
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie ?? ''];
  const session = cookies.find((c) => c.startsWith('orbitask_session='));
  if (!session) {
    throw new Error('No session cookie in response');
  }
  return session.split(';')[0];
}
