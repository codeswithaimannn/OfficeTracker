import { execSync } from 'node:child_process';
import { assertTestDatabase } from './test-database.js';

// Runs once before all e2e tests: brings the test database up to date
// with the latest migrations.
export default function setup(): void {
  assertTestDatabase();
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
}
