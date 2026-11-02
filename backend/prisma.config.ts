import { existsSync } from 'node:fs';
import { defineConfig } from 'prisma/config';

// Load .env for local development. In production the host sets real
// environment variables and there is no .env file.
if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
