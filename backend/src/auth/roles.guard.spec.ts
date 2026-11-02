import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../generated/prisma/client.js';
import { RolesGuard } from './roles.guard.js';

// A minimal stand-in for Nest's ExecutionContext.
function contextFor(role: Role | undefined): ExecutionContext {
  const request = role
    ? { user: { id: 'u1', organizationId: 'o1', role } }
    : {};
  return {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function guardRequiring(roles: Role[] | undefined): RolesGuard {
  const reflector = { getAllAndOverride: () => roles } as unknown as Reflector;
  return new RolesGuard(reflector);
}

describe('RolesGuard', () => {
  it('lets any logged-in user through when the route has no @Roles', () => {
    expect(
      guardRequiring(undefined).canActivate(contextFor(Role.EMPLOYEE)),
    ).toBe(true);
  });

  it('lets a listed role through', () => {
    const guard = guardRequiring([Role.SUPER_ADMIN, Role.MANAGER]);

    expect(guard.canActivate(contextFor(Role.MANAGER))).toBe(true);
  });

  it('refuses a role that is not listed with 403', () => {
    const guard = guardRequiring([Role.SUPER_ADMIN, Role.MANAGER]);

    expect(() => guard.canActivate(contextFor(Role.EMPLOYEE))).toThrow(
      ForbiddenException,
    );
  });

  it('refuses when there is no user on the request', () => {
    const guard = guardRequiring([Role.SUPER_ADMIN]);

    expect(() => guard.canActivate(contextFor(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
