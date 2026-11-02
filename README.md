# Orbitask

**One app, unlimited trackers.** Orbitask is an office management app that any organisation can
shape to its own work, whether it is a CA firm, an IT company, an HR team or a school. Instead of
fixed modules, offices build their own trackers with custom fields, statuses and views, or start
from ready-made templates.

> Status: early development. See [docs/PLAN.md](docs/PLAN.md) for milestones and
> [docs/DECISIONS.md](docs/DECISIONS.md) for the reasoning behind key choices.

## Tech
- **Backend:** Node.js, NestJS, Prisma, PostgreSQL
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, TanStack Query

## Backend setup

Needs Node.js 24 and PostgreSQL 17.

1. Create two databases, one for development and one for the tests:
   ```
   psql -U postgres -c "CREATE DATABASE orbitask_dev;"
   psql -U postgres -c "CREATE DATABASE orbitask_test;"
   ```
2. In `backend/`, copy `.env.example` to `.env` and fill in your PostgreSQL password and a
   `JWT_SECRET` (the file shows how to generate one).
3. Copy `.env` to `.env.test` and change the database name to `orbitask_test`. The tests
   refuse to run against any database whose name does not end in `_test`, because they wipe it.
4. Install, migrate and run:
   ```
   cd backend
   npm install
   npx prisma migrate dev
   npm run start:dev
   ```
   Check http://localhost:3000/api/health.

## Tests

```
cd backend
npm test            # unit tests
npm run test:e2e    # end-to-end tests (uses the orbitask_test database)
```
