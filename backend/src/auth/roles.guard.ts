import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '../generated/prisma/client.js';
import type { AuthenticatedRequest } from './auth.types.js';
import { ROLES_KEY } from './roles.decorator.js';

// Runs after AuthGuard on every route, so request.user is already set.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowed = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!allowed) {
      return true; // no @Roles: any logged-in user
    }

    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!user || !allowed.includes(user.role)) {
      throw new ForbiddenException('You do not have permission to do this');
    }
    return true;
  }
}
