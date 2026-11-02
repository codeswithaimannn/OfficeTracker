import { ForbiddenException } from '@nestjs/common';
import type { AuthUser } from '../auth/auth.types.js';
import { Role } from '../generated/prisma/client.js';
import { assertCanManageRole } from './employee-permissions.js';

const actor = (role: Role): AuthUser => ({
  id: 'u1',
  organizationId: 'o1',
  role,
});

describe('assertCanManageRole', () => {
  it('lets a Super Admin manage every role', () => {
    for (const role of Object.values(Role)) {
      expect(() =>
        assertCanManageRole(actor(Role.SUPER_ADMIN), role),
      ).not.toThrow();
    }
  });

  it('lets a Manager manage Team Leaders and Employees', () => {
    expect(() =>
      assertCanManageRole(actor(Role.MANAGER), Role.TEAM_LEADER),
    ).not.toThrow();
    expect(() =>
      assertCanManageRole(actor(Role.MANAGER), Role.EMPLOYEE),
    ).not.toThrow();
  });

  it('stops a Manager managing Managers or Super Admins', () => {
    expect(() =>
      assertCanManageRole(actor(Role.MANAGER), Role.MANAGER),
    ).toThrow(ForbiddenException);
    expect(() =>
      assertCanManageRole(actor(Role.MANAGER), Role.SUPER_ADMIN),
    ).toThrow(ForbiddenException);
  });

  it('stops Team Leaders and Employees managing anyone', () => {
    for (const role of [Role.TEAM_LEADER, Role.EMPLOYEE]) {
      expect(() => assertCanManageRole(actor(role), Role.EMPLOYEE)).toThrow(
        ForbiddenException,
      );
    }
  });
});
