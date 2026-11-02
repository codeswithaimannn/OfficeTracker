import type { Request } from 'express';
import type { Role } from '../generated/prisma/client.js';

// What we put inside the signed login token.
export interface JwtPayload {
  sub: string; // user id
  org: string; // organisation id
  role: Role;
}

// The logged-in user, attached to the request by AuthGuard.
export interface AuthUser {
  id: string;
  organizationId: string;
  role: Role;
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}
