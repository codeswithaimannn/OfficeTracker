import { requireOrganizationId } from '../tenant/tenant-context.js';
import { PrismaService } from './prisma.service.js';
import { tenantExtension } from './tenant-extension.js';

// Injection token for the tenant-scoped client:
//   constructor(@Inject(TENANT_PRISMA) private readonly db: TenantPrisma) {}
//
// Rule: feature code uses TenantPrisma. The plain PrismaService is only for
// the few places that must work across organisations (sign-up, login and
// the auth guard, which run before we know the organisation).
export const TENANT_PRISMA = Symbol('TENANT_PRISMA');

export function createTenantPrisma(prisma: PrismaService) {
  return prisma.$extends(tenantExtension(requireOrganizationId));
}

export type TenantPrisma = ReturnType<typeof createTenantPrisma>;
