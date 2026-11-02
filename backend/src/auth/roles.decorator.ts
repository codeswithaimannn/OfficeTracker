import { SetMetadata } from '@nestjs/common';
import type { Role } from '../generated/prisma/client.js';

export const ROLES_KEY = 'roles';

// Limits a route (or a whole controller) to the listed roles.
// Without it, any logged-in user may call the route.
//   @Roles(Role.SUPER_ADMIN, Role.MANAGER)
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
