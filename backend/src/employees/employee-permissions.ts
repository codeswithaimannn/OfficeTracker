import { ForbiddenException } from '@nestjs/common';
import { Role } from '../generated/prisma/client.js';
import type { AuthUser } from '../auth/auth.types.js';

// Who may manage whom (see docs/DECISIONS.md, M4):
// - Super Admins manage everyone and can give any role.
// - Managers manage only Team Leaders and Employees, and can only give
//   those two roles (no promoting anyone to their own level or above).
// The routes themselves are already limited to these two roles by @Roles.

const MANAGER_CAN_MANAGE: readonly Role[] = [Role.TEAM_LEADER, Role.EMPLOYEE];

// Called with the target's current role (before editing, deactivating or
// reactivating them) and with any role the actor wants to give.
export function assertCanManageRole(actor: AuthUser, role: Role): void {
  if (actor.role === Role.SUPER_ADMIN) return;
  if (actor.role === Role.MANAGER && MANAGER_CAN_MANAGE.includes(role)) return;
  throw new ForbiddenException(
    'Managers can only manage Team Leaders and Employees',
  );
}
