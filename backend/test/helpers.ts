import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { AUTH_COOKIE } from '../src/auth/auth.constants.js';
import { Role } from '../src/generated/prisma/client.js';
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

export interface TestMember {
  id: string;
  cookie: string;
}

// Adds a user with the given role straight into the database and returns
// a valid login cookie for them (signed like a real login, without the
// slow password check or the login rate limit).
export async function addMember(
  app: TestApp,
  organizationId: string,
  role: Role,
  email: string,
  departmentId?: string,
): Promise<TestMember> {
  const user = await app.get(PrismaService).user.create({
    data: {
      organizationId,
      role,
      email,
      name: `Test ${role}`,
      passwordHash: 'not-used-in-tests',
      departmentId,
    },
  });
  const token = await app.get(JwtService).signAsync({
    sub: user.id,
    org: organizationId,
    role,
  });
  return { id: user.id, cookie: `${AUTH_COOKIE}=${token}` };
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
