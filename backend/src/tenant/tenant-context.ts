import { AsyncLocalStorage } from 'node:async_hooks';
import type { NextFunction, Request, Response } from 'express';

// Per-request memory. Every request gets its own store, and any code that
// runs while handling that request (services, Prisma queries) can read it
// without passing it around by hand.
interface TenantStore {
  organizationId?: string;
}

const storage = new AsyncLocalStorage<TenantStore>();

export function runWithTenantStore<T>(fn: () => T, store: TenantStore = {}): T {
  return storage.run(store, fn);
}

// Express middleware: opens an empty store for each request. AuthGuard
// fills in the organisation once it knows who is logged in.
export function tenantContextMiddleware(
  _req: Request,
  _res: Response,
  next: NextFunction,
): void {
  runWithTenantStore(() => next());
}

export function setCurrentOrganization(organizationId: string): void {
  const store = storage.getStore();
  if (!store) {
    throw new Error(
      'Tenant store missing: is tenantContextMiddleware installed?',
    );
  }
  store.organizationId = organizationId;
}

// Fails closed: a tenant query with no organisation is an error, never
// "all organisations".
export function requireOrganizationId(): string {
  const organizationId = storage.getStore()?.organizationId;
  if (!organizationId) {
    throw new Error('No organisation in the request context');
  }
  return organizationId;
}
