import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import {
  createTestApp,
  resetDatabase,
  sessionCookie,
  signUp,
  TestApp,
} from './helpers.js';

const PASSWORD = 'correct-horse-1';
const LOGIN_LIMIT = 5;

describe('Auth (e2e)', () => {
  let app: TestApp;
  const http = () => request(app.getHttpServer());

  // A fresh app per test also resets the in-memory rate limit counters.
  beforeEach(async () => {
    app = await createTestApp();
    await resetDatabase(app);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('sign-up', () => {
    it('creates an organisation and its Super Admin, and logs them in', async () => {
      const res = await http()
        .post('/api/auth/signup')
        .send({
          organizationName: 'Demo Office',
          name: 'Priya S',
          email: '  Priya@Demo.TEST ',
          password: PASSWORD,
        })
        .expect(201);

      expect(res.body).toMatchObject({
        name: 'Priya S',
        email: 'priya@demo.test',
        role: 'SUPER_ADMIN',
        organization: { name: 'Demo Office' },
      });
      const setCookie = String(res.headers['set-cookie']);
      expect(setCookie).toContain('HttpOnly');
      expect(setCookie).toContain('SameSite=Lax');
    });

    it('never returns the password hash', async () => {
      const { body } = await signUp(app, 'Demo Office', 'priya@demo.test');

      expect(JSON.stringify(body)).not.toMatch(/password/i);
    });

    it('stores a bcrypt hash, not the password', async () => {
      await signUp(app, 'Demo Office', 'priya@demo.test', PASSWORD);

      const user = await app
        .get(PrismaService)
        .user.findUniqueOrThrow({ where: { email: 'priya@demo.test' } });
      expect(user.passwordHash).not.toBe(PASSWORD);
      expect(user.passwordHash).toMatch(/^\$2[aby]\$/);
    });

    it('rejects an email that is already used (any letter case)', async () => {
      await signUp(app, 'Demo Office', 'priya@demo.test');

      const res = await http()
        .post('/api/auth/signup')
        .send({
          organizationName: 'Other',
          name: 'Someone',
          email: 'PRIYA@demo.test',
          password: PASSWORD,
        })
        .expect(409);
      expect(res.body.message).toBe(
        'An account with this email already exists',
      );
    });

    it('rejects bad input and unknown fields', async () => {
      const res = await http()
        .post('/api/auth/signup')
        .send({
          organizationName: 'X',
          email: 'nope',
          password: 'short',
          role: 'SUPER_ADMIN',
        })
        .expect(400);

      expect(res.body.message).toEqual(
        expect.arrayContaining([
          'property role should not exist',
          'email must be an email',
        ]),
      );
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await signUp(app, 'Demo Office', 'priya@demo.test', PASSWORD);
    });

    it('logs in with the right password and sets the cookie', async () => {
      const res = await http()
        .post('/api/auth/login')
        .send({ email: 'Priya@demo.test', password: PASSWORD })
        .expect(200);

      expect(res.body.email).toBe('priya@demo.test');
      expect(sessionCookie(res.headers['set-cookie'])).toMatch(
        /^orbitask_session=.+/,
      );
    });

    it('gives the same answer for a wrong password and an unknown email', async () => {
      const wrongPassword = await http()
        .post('/api/auth/login')
        .send({ email: 'priya@demo.test', password: 'wrong-password' })
        .expect(401);
      const unknownEmail = await http()
        .post('/api/auth/login')
        .send({ email: 'ghost@demo.test', password: 'wrong-password' })
        .expect(401);

      expect(wrongPassword.body.message).toBe('Invalid email or password');
      expect(unknownEmail.body.message).toBe('Invalid email or password');
    });

    it('rejects a deactivated user', async () => {
      await app.get(PrismaService).user.update({
        where: { email: 'priya@demo.test' },
        data: { isActive: false },
      });

      await http()
        .post('/api/auth/login')
        .send({ email: 'priya@demo.test', password: PASSWORD })
        .expect(401);
    });

    it(`allows ${LOGIN_LIMIT} attempts per minute, then answers 429`, async () => {
      for (let i = 0; i < LOGIN_LIMIT; i++) {
        await http()
          .post('/api/auth/login')
          .send({ email: 'priya@demo.test', password: 'wrong-password' })
          .expect(401);
      }

      await http()
        .post('/api/auth/login')
        .send({ email: 'priya@demo.test', password: PASSWORD })
        .expect(429);
    });
  });

  describe('me and logout', () => {
    it('returns 401 without a login cookie', async () => {
      await http().get('/api/auth/me').expect(401);
    });

    it('returns 401 for a forged or broken token', async () => {
      await http()
        .get('/api/auth/me')
        .set('Cookie', 'orbitask_session=not-a-real-token')
        .expect(401);
    });

    it('returns the logged-in user', async () => {
      const { cookie, body } = await signUp(
        app,
        'Demo Office',
        'priya@demo.test',
      );

      const res = await http()
        .get('/api/auth/me')
        .set('Cookie', cookie)
        .expect(200);

      expect(res.body).toEqual(body);
    });

    it('locks out a user as soon as they are deactivated', async () => {
      const { cookie } = await signUp(app, 'Demo Office', 'priya@demo.test');
      await app.get(PrismaService).user.update({
        where: { email: 'priya@demo.test' },
        data: { isActive: false },
      });

      await http().get('/api/auth/me').set('Cookie', cookie).expect(401);
    });

    it('logout clears the cookie', async () => {
      const res = await http().post('/api/auth/logout').expect(204);

      expect(String(res.headers['set-cookie'])).toMatch(
        /orbitask_session=;.*Expires=Thu, 01 Jan 1970/,
      );
    });
  });

  describe('two organisations', () => {
    it('each user sees only their own organisation', async () => {
      const a = await signUp(app, 'Org A', 'admin@a.test');
      const b = await signUp(app, 'Org B', 'admin@b.test');

      const meA = await http()
        .get('/api/auth/me')
        .set('Cookie', a.cookie)
        .expect(200);
      const meB = await http()
        .get('/api/auth/me')
        .set('Cookie', b.cookie)
        .expect(200);

      expect(meA.body.organization.name).toBe('Org A');
      expect(meB.body.organization.name).toBe('Org B');
      expect(meA.body.organization.id).not.toBe(meB.body.organization.id);
    });
  });
});
