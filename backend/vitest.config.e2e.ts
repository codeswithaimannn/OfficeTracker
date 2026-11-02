import { existsSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

// e2e tests use the separate test database from .env.test. Loaded first,
// so these values win over .env (loadEnvFile never overwrites a variable
// that is already set).
if (existsSync('.env.test')) {
  process.loadEnvFile('.env.test');
}

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    globalSetup: ['./test/global-setup.ts'],
    // The test files share one database, so run them one at a time.
    fileParallelism: false,
  },
});
