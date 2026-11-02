import type { Role } from './auth';

// The same rules as the backend (backend/src/employees/employee-permissions.ts).
// Here they only decide which buttons to show; the backend enforces them.

const ADMIN_ROLES: readonly Role[] = ['SUPER_ADMIN', 'MANAGER'];
const MANAGER_CAN_MANAGE: readonly Role[] = ['TEAM_LEADER', 'EMPLOYEE'];
export const ALL_ROLES: readonly Role[] = [
  'SUPER_ADMIN',
  'MANAGER',
  'TEAM_LEADER',
  'EMPLOYEE',
];

export function canEditDepartments(role: Role): boolean {
  return ADMIN_ROLES.includes(role);
}

export function canAddEmployees(role: Role): boolean {
  return ADMIN_ROLES.includes(role);
}

// May someone with actorRole edit or deactivate someone with targetRole?
export function canManageRole(actorRole: Role, targetRole: Role): boolean {
  if (actorRole === 'SUPER_ADMIN') return true;
  return actorRole === 'MANAGER' && MANAGER_CAN_MANAGE.includes(targetRole);
}

// The roles an actor may give to someone.
export function assignableRoles(actorRole: Role): Role[] {
  return ALL_ROLES.filter((role) => canManageRole(actorRole, role));
}
