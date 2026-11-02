import request from 'supertest';
import { EmployeesService } from '../src/employees/employees.service.js';
import { Role } from '../src/generated/prisma/client.js';
import { runWithTenantStore } from '../src/tenant/tenant-context.js';
import {
  addMember,
  createTestApp,
  resetDatabase,
  SignedUpUser,
  signUp,
  TestApp,
  TestMember,
} from './helpers.js';

const PASSWORD = 'starting-pass-1';

describe('Employees (e2e)', () => {
  let app: TestApp;
  let admin: SignedUpUser; // the Super Admin who signed up organisation A
  let manager: TestMember;
  let employee: TestMember;
  let orgId: string;
  const http = () => request(app.getHttpServer());

  const addEmployee = (cookie: string, body: Record<string, unknown>) =>
    http()
      .post('/api/employees')
      .set('Cookie', cookie)
      .send({
        name: 'New Person',
        password: PASSWORD,
        role: Role.EMPLOYEE,
        ...body,
      });

  beforeEach(async () => {
    app = await createTestApp();
    await resetDatabase(app);
    admin = await signUp(app, 'Org A', 'admin@a.test');
    orgId = admin.body.organization.id;
    manager = await addMember(app, orgId, Role.MANAGER, 'manager@a.test');
    employee = await addMember(app, orgId, Role.EMPLOYEE, 'employee@a.test');
  });

  afterEach(async () => {
    await app.close();
  });

  describe('adding employees', () => {
    it('lets a Manager add an Employee who can then log in', async () => {
      const res = await addEmployee(manager.cookie, {
        name: 'Ravi K',
        email: ' Ravi@A.test ',
      }).expect(201);

      expect(res.body).toMatchObject({
        name: 'Ravi K',
        email: 'ravi@a.test',
        role: 'EMPLOYEE',
        isActive: true,
        department: null,
      });
      expect(JSON.stringify(res.body)).not.toMatch(/password/i);

      await http()
        .post('/api/auth/login')
        .send({ email: 'ravi@a.test', password: PASSWORD })
        .expect(200);
    });

    it('puts the new employee in a department', async () => {
      const dept = await http()
        .post('/api/departments')
        .set('Cookie', admin.cookie)
        .send({ name: 'Sales' });

      const res = await addEmployee(admin.cookie, {
        email: 'seller@a.test',
        departmentId: dept.body.id,
      }).expect(201);

      expect(res.body.department).toEqual({ id: dept.body.id, name: 'Sales' });
    });

    it('stops a Manager creating a Manager or Super Admin', async () => {
      for (const role of [Role.MANAGER, Role.SUPER_ADMIN]) {
        const res = await addEmployee(manager.cookie, {
          email: `${role}@a.test`,
          role,
        }).expect(403);
        expect(res.body.message).toBe(
          'Managers can only manage Team Leaders and Employees',
        );
      }
    });

    it('lets a Super Admin create a Manager', async () => {
      await addEmployee(admin.cookie, {
        email: 'boss@a.test',
        role: Role.MANAGER,
      }).expect(201);
    });

    it('refuses an Employee adding anyone', async () => {
      await addEmployee(employee.cookie, { email: 'x@a.test' }).expect(403);
    });

    it('refuses an email that is already used', async () => {
      const res = await addEmployee(admin.cookie, {
        email: 'EMPLOYEE@a.test',
      }).expect(409);
      expect(res.body.message).toBe(
        'An account with this email already exists',
      );
    });
  });

  describe('listing', () => {
    it('lets everyone see the list, with search and status filters', async () => {
      await http()
        .post(`/api/employees/${employee.id}/deactivate`)
        .set('Cookie', admin.cookie)
        .expect(200);

      const all = await http()
        .get('/api/employees')
        .set('Cookie', manager.cookie)
        .expect(200);
      expect(all.body).toHaveLength(3);

      const search = await http()
        .get('/api/employees?search=MANAGER@')
        .set('Cookie', manager.cookie);
      expect(search.body.map((e: { email: string }) => e.email)).toEqual([
        'manager@a.test',
      ]);

      const inactive = await http()
        .get('/api/employees?status=inactive')
        .set('Cookie', manager.cookie);
      expect(inactive.body.map((e: { email: string }) => e.email)).toEqual([
        'employee@a.test',
      ]);
    });

    it('rejects an unknown status value', async () => {
      await http()
        .get('/api/employees?status=deleted')
        .set('Cookie', admin.cookie)
        .expect(400);
    });
  });

  describe('editing', () => {
    it('lets a Manager move an Employee to Team Leader', async () => {
      const res = await http()
        .patch(`/api/employees/${employee.id}`)
        .set('Cookie', manager.cookie)
        .send({ role: Role.TEAM_LEADER, name: 'Promoted Person' })
        .expect(200);

      expect(res.body).toMatchObject({
        role: 'TEAM_LEADER',
        name: 'Promoted Person',
      });
    });

    it('stops a Manager promoting anyone to Manager', async () => {
      await http()
        .patch(`/api/employees/${employee.id}`)
        .set('Cookie', manager.cookie)
        .send({ role: Role.MANAGER })
        .expect(403);
    });

    it('stops a Manager editing another Manager', async () => {
      const other = await addMember(app, orgId, Role.MANAGER, 'other@a.test');

      await http()
        .patch(`/api/employees/${other.id}`)
        .set('Cookie', manager.cookie)
        .send({ name: 'Changed' })
        .expect(403);
    });

    it('stops anyone changing their own role', async () => {
      const res = await http()
        .patch(`/api/employees/${admin.body.id}`)
        .set('Cookie', admin.cookie)
        .send({ role: Role.EMPLOYEE })
        .expect(400);
      expect(res.body.message).toBe('You cannot change your own role');
    });

    it('lets a Super Admin demote another Super Admin', async () => {
      const second = await addMember(
        app,
        orgId,
        Role.SUPER_ADMIN,
        'second@a.test',
      );

      const res = await http()
        .patch(`/api/employees/${admin.body.id}`)
        .set('Cookie', second.cookie)
        .send({ role: Role.MANAGER })
        .expect(200);
      expect(res.body.role).toBe('MANAGER');
    });

    it('refuses a department from another organisation', async () => {
      const orgB = await signUp(app, 'Org B', 'admin@b.test');
      const deptB = await http()
        .post('/api/departments')
        .set('Cookie', orgB.cookie)
        .send({ name: 'B Sales' });

      const res = await http()
        .patch(`/api/employees/${employee.id}`)
        .set('Cookie', admin.cookie)
        .send({ departmentId: deptB.body.id })
        .expect(400);
      expect(res.body.message).toBe('Department not found');
    });
  });

  describe('deactivating', () => {
    it('locks a deactivated employee out at once, and reactivating restores access', async () => {
      await http()
        .get('/api/auth/me')
        .set('Cookie', employee.cookie)
        .expect(200);

      const res = await http()
        .post(`/api/employees/${employee.id}/deactivate`)
        .set('Cookie', manager.cookie)
        .expect(200);
      expect(res.body.isActive).toBe(false);
      await http()
        .get('/api/auth/me')
        .set('Cookie', employee.cookie)
        .expect(401);

      await http()
        .post(`/api/employees/${employee.id}/reactivate`)
        .set('Cookie', manager.cookie)
        .expect(200);
      await http()
        .get('/api/auth/me')
        .set('Cookie', employee.cookie)
        .expect(200);
    });

    it('stops anyone deactivating themselves', async () => {
      // A Manager is stopped by the role rule (Managers cannot manage
      // Managers, themselves included)...
      await http()
        .post(`/api/employees/${manager.id}/deactivate`)
        .set('Cookie', manager.cookie)
        .expect(403);

      // ...and a Super Admin by the self rule.
      const own = await http()
        .post(`/api/employees/${admin.body.id}/deactivate`)
        .set('Cookie', admin.cookie)
        .expect(400);
      expect(own.body.message).toBe('You cannot deactivate yourself');
    });
  });

  // Through the API this rule is never reached: only a Super Admin may act on
  // a Super Admin, never on themselves, so two active ones always exist. It
  // is a safety net for future code paths, so it is tested on the service.
  describe('last active Super Admin (safety net)', () => {
    const someOtherSuperAdmin = () => ({
      id: '00000000-0000-4000-8000-000000000000',
      organizationId: orgId,
      role: Role.SUPER_ADMIN,
    });
    const asOrgA = <T>(fn: () => Promise<T>) =>
      runWithTenantStore(async () => await fn(), { organizationId: orgId });

    it('refuses to deactivate the only active Super Admin', async () => {
      const service = app.get(EmployeesService);

      await expect(
        asOrgA(() =>
          service.setActive(someOtherSuperAdmin(), admin.body.id, false),
        ),
      ).rejects.toThrow(
        'The organisation needs at least one active Super Admin',
      );
    });

    it('refuses to demote the only active Super Admin', async () => {
      const service = app.get(EmployeesService);

      await expect(
        asOrgA(() =>
          service.update(someOtherSuperAdmin(), admin.body.id, {
            role: Role.MANAGER,
          }),
        ),
      ).rejects.toThrow(
        'The organisation needs at least one active Super Admin',
      );
    });
  });

  describe('organisation isolation', () => {
    it('organisation B cannot see or change A’s employees', async () => {
      const orgB = await signUp(app, 'Org B', 'admin@b.test');

      const list = await http()
        .get('/api/employees')
        .set('Cookie', orgB.cookie);
      expect(list.body.map((e: { email: string }) => e.email)).toEqual([
        'admin@b.test',
      ]);

      await http()
        .patch(`/api/employees/${employee.id}`)
        .set('Cookie', orgB.cookie)
        .send({ name: 'Hacked' })
        .expect(404);
      await http()
        .post(`/api/employees/${employee.id}/deactivate`)
        .set('Cookie', orgB.cookie)
        .expect(404);

      await http()
        .get('/api/auth/me')
        .set('Cookie', employee.cookie)
        .expect(200);
    });
  });
});
