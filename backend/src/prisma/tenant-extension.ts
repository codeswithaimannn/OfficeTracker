import { Prisma } from '../generated/prisma/client.js';

// THE central place for organisation isolation.
//
// For each model: the column that holds its organisation id. Every query
// on these models through the tenant client gets that column added to its
// filter (reads, updates, deletes) or its data (creates).
// A new tenant table MUST be added here; a model missing from this list
// is refused, so a forgotten table fails loudly instead of leaking.
export const TENANT_COLUMN: Record<string, string> = {
  Organization: 'id', // a user may only see their own organisation
  User: 'organizationId',
};

const FILTERED_OPERATIONS = new Set([
  'findUnique',
  'findUniqueOrThrow',
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
  'update',
  'updateMany',
  'updateManyAndReturn',
  'delete',
  'deleteMany',
]);
const CREATE_MANY_OPERATIONS = new Set(['createMany', 'createManyAndReturn']);

type Args = Record<string, unknown>;

function withValue(object: unknown, column: string, value: string): Args {
  // The organisation id is written last, so a caller cannot override it.
  return { ...(object as Args | undefined), [column]: value };
}

// Returns a copy of the query arguments, scoped to one organisation.
export function scopeArgs(
  model: string,
  operation: string,
  args: unknown,
  organizationId: string,
): Args {
  const column = TENANT_COLUMN[model];
  if (!column) {
    throw new Error(`Tenant isolation: model ${model} is not registered`);
  }
  const scoped: Args = { ...(args as Args | undefined) };

  if (FILTERED_OPERATIONS.has(operation)) {
    scoped.where = withValue(scoped.where, column, organizationId);
    return scoped;
  }

  // Organisations are created only by sign-up, never inside a tenant.
  const canCreate = column !== 'id';
  if (canCreate && operation === 'create') {
    scoped.data = withValue(scoped.data, column, organizationId);
    return scoped;
  }
  if (canCreate && CREATE_MANY_OPERATIONS.has(operation)) {
    const rows = Array.isArray(scoped.data) ? scoped.data : [scoped.data];
    scoped.data = rows.map((row) => withValue(row, column, organizationId));
    return scoped;
  }
  if (canCreate && operation === 'upsert') {
    scoped.where = withValue(scoped.where, column, organizationId);
    scoped.create = withValue(scoped.create, column, organizationId);
    return scoped;
  }

  throw new Error(
    `Tenant isolation: ${model}.${operation} is not allowed on the tenant client`,
  );
}

// Note: raw SQL ($queryRaw) is NOT covered by this extension. Raw queries on
// tenant tables must filter by organization_id themselves.
export function tenantExtension(getOrganizationId: () => string) {
  return Prisma.defineExtension({
    name: 'tenant-isolation',
    query: {
      $allModels: {
        $allOperations({ model, operation, args, query }) {
          const scoped = scopeArgs(model, operation, args, getOrganizationId());
          return query(scoped as typeof args);
        },
      },
    },
  });
}
