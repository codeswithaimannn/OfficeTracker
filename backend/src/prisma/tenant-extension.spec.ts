import { scopeArgs } from './tenant-extension.js';

const ORG_A = 'org-a';
const ORG_B = 'org-b';

describe('scopeArgs (organisation isolation)', () => {
  it('adds the organisation to every read filter', () => {
    for (const operation of ['findMany', 'findFirst', 'findUnique', 'count']) {
      const scoped = scopeArgs(
        'User',
        operation,
        { where: { name: 'X' } },
        ORG_A,
      );
      expect(scoped.where).toEqual({ name: 'X', organizationId: ORG_A });
    }
  });

  it('adds a filter even when the query has none', () => {
    expect(scopeArgs('User', 'findMany', undefined, ORG_A)).toEqual({
      where: { organizationId: ORG_A },
    });
  });

  it('cannot be overridden by a filter for another organisation', () => {
    const scoped = scopeArgs(
      'User',
      'findMany',
      { where: { organizationId: ORG_B } },
      ORG_A,
    );
    expect(scoped.where).toEqual({ organizationId: ORG_A });
  });

  it('scopes updates and deletes', () => {
    for (const operation of ['update', 'updateMany', 'delete', 'deleteMany']) {
      const scoped = scopeArgs(
        'User',
        operation,
        { where: { id: 'u1' } },
        ORG_A,
      );
      expect(scoped.where).toEqual({ id: 'u1', organizationId: ORG_A });
    }
  });

  it('stamps the organisation on created rows, replacing any other value', () => {
    const scoped = scopeArgs(
      'User',
      'create',
      { data: { name: 'X', organizationId: ORG_B } },
      ORG_A,
    );
    expect(scoped.data).toEqual({ name: 'X', organizationId: ORG_A });
  });

  it('stamps every row of a createMany', () => {
    const scoped = scopeArgs(
      'User',
      'createMany',
      { data: [{ name: 'X' }, { name: 'Y' }] },
      ORG_A,
    );
    expect(scoped.data).toEqual([
      { name: 'X', organizationId: ORG_A },
      { name: 'Y', organizationId: ORG_A },
    ]);
  });

  it('limits organisation reads to the current organisation by id', () => {
    const scoped = scopeArgs('Organization', 'findMany', {}, ORG_A);
    expect(scoped.where).toEqual({ id: ORG_A });
  });

  it('refuses to create an organisation inside a tenant', () => {
    expect(() =>
      scopeArgs('Organization', 'create', { data: { name: 'X' } }, ORG_A),
    ).toThrow('not allowed');
  });

  it('refuses a model that is not registered', () => {
    expect(() => scopeArgs('Invoice', 'findMany', {}, ORG_A)).toThrow(
      'not registered',
    );
  });
});
