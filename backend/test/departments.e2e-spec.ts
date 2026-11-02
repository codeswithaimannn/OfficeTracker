import request from 'supertest';
import { Role } from '../src/generated/prisma/client.js';
import {
  addMember,
  createTestApp,
  resetDatabase,
  SignedUpUser,
  signUp,
  TestApp,
  TestMember,
} from './helpers.js';

describe('Departments (e2e)', () => {
  let app: TestApp;
  let admin: SignedUpUser; // Super Admin of organisation A
  let manager: TestMember;
  let employee: TestMember;
  const http = () => request(app.getHttpServer());

  const createDepartment = (cookie: string, name: string) =>
    http().post('/api/departments').set('Cookie', cookie).send({ name });

  beforeEach(async () => {
    app = await createTestApp();
    await resetDatabase(app);
    admin = await signUp(app, 'Org A', 'admin@a.test');
    const orgId = admin.body.organization.id;
    manager = await addMember(app, orgId, Role.MANAGER, 'manager@a.test');
    employee = await addMember(app, orgId, Role.EMPLOYEE, 'employee@a.test');
  });

  afterEach(async () => {
    await app.close();
  });

  describe('roles', () => {
    it('lets a Manager create a department', async () => {
      const res = await createDepartment(manager.cookie, '  Sales  ').expect(
        201,
      );

      expect(res.body).toMatchObject({
        name: 'Sales',
        description: null,
        employeeCount: 0,
      });
    });

    it('lets an Employee list departments but not create one', async () => {
      await createDepartment(admin.cookie, 'Sales').expect(201);

      const list = await http()
        .get('/api/departments')
        .set('Cookie', employee.cookie)
        .expect(200);
      expect(list.body.map((d: { name: string }) => d.name)).toEqual(['Sales']);

      const res = await createDepartment(employee.cookie, 'Marketing').expect(
        403,
      );
      expect(res.body.message).toBe('You do not have permission to do this');
    });

    it('refuses a Team Leader changing or deleting a department', async () => {
      const leader = await addMember(
        app,
        admin.body.organization.id,
        Role.TEAM_LEADER,
        'leader@a.test',
      );
      const { body } = await createDepartment(admin.cookie, 'Sales');

      await http()
        .patch(`/api/departments/${body.id}`)
        .set('Cookie', leader.cookie)
        .send({ name: 'Renamed' })
        .expect(403);
      await http()
        .delete(`/api/departments/${body.id}`)
        .set('Cookie', leader.cookie)
        .expect(403);
    });
  });

  describe('rules', () => {
    it('rejects a duplicate name in the same organisation', async () => {
      await createDepartment(admin.cookie, 'Sales').expect(201);

      const res = await createDepartment(admin.cookie, 'Sales').expect(409);
      expect(res.body.message).toBe(
        'A department with this name already exists',
      );
    });

    it('allows the same name in another organisation', async () => {
      const orgB = await signUp(app, 'Org B', 'admin@b.test');
      await createDepartment(admin.cookie, 'Sales').expect(201);

      await createDepartment(orgB.cookie, 'Sales').expect(201);
    });

    it('renames a department', async () => {
      const { body } = await createDepartment(admin.cookie, 'Sales');

      const res = await http()
        .patch(`/api/departments/${body.id}`)
        .set('Cookie', admin.cookie)
        .send({ name: 'Sales & Marketing', description: 'Revenue team' })
        .expect(200);
      expect(res.body).toMatchObject({
        name: 'Sales & Marketing',
        description: 'Revenue team',
      });
    });

    it('refuses to delete a department that still has employees', async () => {
      const { body } = await createDepartment(admin.cookie, 'Sales');
      await addMember(
        app,
        admin.body.organization.id,
        Role.EMPLOYEE,
        'seller@a.test',
        body.id,
      );

      const res = await http()
        .delete(`/api/departments/${body.id}`)
        .set('Cookie', admin.cookie)
        .expect(409);
      expect(res.body.message).toBe(
        'Move its 1 employee to another department first',
      );
    });

    it('deletes an empty department', async () => {
      const { body } = await createDepartment(admin.cookie, 'Sales');

      await http()
        .delete(`/api/departments/${body.id}`)
        .set('Cookie', admin.cookie)
        .expect(204);
      const list = await http()
        .get('/api/departments')
        .set('Cookie', admin.cookie);
      expect(list.body).toEqual([]);
    });

    it('answers 404 for an unknown id and 400 for a malformed one', async () => {
      await http()
        .patch('/api/departments/00000000-0000-4000-8000-000000000000')
        .set('Cookie', admin.cookie)
        .send({ name: 'X Y' })
        .expect(404);
      await http()
        .patch('/api/departments/not-a-uuid')
        .set('Cookie', admin.cookie)
        .send({ name: 'X Y' })
        .expect(400);
    });
  });

  describe('organisation isolation', () => {
    it('organisation B cannot see, rename or delete A’s department', async () => {
      const orgB = await signUp(app, 'Org B', 'admin@b.test');
      const { body: sales } = await createDepartment(admin.cookie, 'Sales');

      const list = await http()
        .get('/api/departments')
        .set('Cookie', orgB.cookie);
      expect(list.body).toEqual([]);

      await http()
        .patch(`/api/departments/${sales.id}`)
        .set('Cookie', orgB.cookie)
        .send({ name: 'Hacked' })
        .expect(404);
      await http()
        .delete(`/api/departments/${sales.id}`)
        .set('Cookie', orgB.cookie)
        .expect(404);

      const stillThere = await http()
        .get('/api/departments')
        .set('Cookie', admin.cookie);
      expect(stillThere.body.map((d: { name: string }) => d.name)).toEqual([
        'Sales',
      ]);
    });
  });
});
