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

// The tenant extension adds organizationId to every create, but Prisma's
// types still ask for it. This satisfies the types in one place:
//   data: tenantData<Prisma.DepartmentUncheckedCreateInput>({ name })
export function tenantData<T extends { organizationId: string }>(
  data: Omit<T, 'organizationId'>,
): T {
  return data as T;
}
