import { Prisma } from '../src/generated/prisma/client.js';
import { TENANT_PRISMA, TenantPrisma } from '../src/prisma/tenant-prisma.js';
import { runWithTenantStore } from '../src/tenant/tenant-context.js';
import {
  createTestApp,
  resetDatabase,
  SignedUpUser,
  signUp,
  TestApp,
} from './helpers.js';

// Runs real queries against the test database through the tenant client,
// as organisation A, and checks organisation B's data stays out of reach.
describe('Organisation isolation (e2e)', () => {
  let app: TestApp;
  let db: TenantPrisma;
  let orgA: SignedUpUser;
  let orgB: SignedUpUser;

  // Prisma queries are lazy: they run when awaited. So the await must happen
  // inside the context, not after it.
  const asOrg = <T>(user: SignedUpUser, fn: () => Promise<T>): Promise<T> =>
    runWithTenantStore(async () => await fn(), {
      organizationId: user.body.organization.id,
    });

  beforeEach(async () => {
    app = await createTestApp();
    await resetDatabase(app);
    db = app.get<TenantPrisma>(TENANT_PRISMA);
    orgA = await signUp(app, 'Org A', 'admin@a.test');
    orgB = await signUp(app, 'Org B', 'admin@b.test');
  });

  afterEach(async () => {
    await app.close();
  });

  it('lists only users of the current organisation', async () => {
    const users = await asOrg(orgA, () => db.user.findMany());

    expect(users.map((u) => u.email)).toEqual(['admin@a.test']);
  });

  it('cannot read another organisation’s user by id', async () => {
    const user = await asOrg(orgA, () =>
      db.user.findUnique({ where: { id: orgB.body.id } }),
    );

    expect(user).toBeNull();
  });

  it('cannot read another organisation', async () => {
    const orgs = await asOrg(orgA, () => db.organization.findMany());

    expect(orgs.map((o) => o.name)).toEqual(['Org A']);
  });

  it('cannot update another organisation’s user', async () => {
    const attempt = asOrg(orgA, () =>
      db.user.update({ where: { id: orgB.body.id }, data: { name: 'Hacked' } }),
    );

    await expect(attempt).rejects.toBeInstanceOf(
      Prisma.PrismaClientKnownRequestError,
    );
    const untouched = await asOrg(orgB, () =>
      db.user.findUnique({ where: { id: orgB.body.id } }),
    );
    expect(untouched?.name).toBe('Test Admin');
  });

  it('cannot delete another organisation’s users', async () => {
    const result = await asOrg(orgA, () =>
      db.user.deleteMany({ where: { email: 'admin@b.test' } }),
    );

    expect(result.count).toBe(0);
    expect(await asOrg(orgB, () => db.user.count())).toBe(1);
  });

  it('creates rows in the current organisation even if told otherwise', async () => {
    const created = await asOrg(orgA, () =>
      db.user.create({
        data: {
          name: 'Sneaky',
          email: 'sneaky@a.test',
          passwordHash: 'x',
          organizationId: orgB.body.organization.id,
        },
      }),
    );

    expect(created.organizationId).toBe(orgA.body.organization.id);
  });

  it('refuses to query with no organisation in the context', async () => {
    await expect(
      runWithTenantStore(async () => await db.user.findMany()),
    ).rejects.toThrow('No organisation in the request context');
  });
});
