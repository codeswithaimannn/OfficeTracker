// Safety check: tests wipe their database, so refuse to run against
// anything that is not clearly a test database.
export function assertTestDatabase(): void {
  const url = process.env.DATABASE_URL ?? '';
  const databaseName = new URL(url).pathname.slice(1);
  if (!databaseName.endsWith('_test')) {
    throw new Error(
      `Refusing to run tests: DATABASE_URL points at "${databaseName}", ` +
        'not a *_test database. Create backend/.env.test (see README).',
    );
  }
}
