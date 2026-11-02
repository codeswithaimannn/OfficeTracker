import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import { setCurrentOrganization } from '../tenant/tenant-context.js';
import { AUTH_COOKIE } from './auth.constants.js';
import { AuthenticatedRequest, JwtPayload } from './auth.types.js';
import { IS_PUBLIC_KEY } from './public.decorator.js';

// Runs before every route (registered globally in AuthModule).
// Secure by default: a route is open only if it is marked @Public().
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token: unknown = request.cookies?.[AUTH_COOKIE];
    if (typeof token !== 'string') {
      throw new UnauthorizedException();
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException(); // bad signature or expired
    }

    // Check the user still exists and is active, so deactivating someone
    // takes effect at once, not when their token expires.
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, organizationId: true, role: true, isActive: true },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    request.user = {
      id: user.id,
      organizationId: user.organizationId,
      role: user.role,
    };
    // From here on, every tenant query in this request is limited to
    // this user's organisation.
    setCurrentOrganization(user.organizationId);
    return true;
  }
}
