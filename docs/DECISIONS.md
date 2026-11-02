# Decisions

A short log of key choices and why. Newest at the bottom.

## 2026-11-02: Build a small MVP around the tracker builder
The original spec has 12 modules, close to the scope of ClickUp or Monday.com, which is too much for
one developer. The MVP focuses on the part that makes the app different, the custom tracker builder,
and does it well. Everything else is listed under "Later" in PLAN.md.

## 2026-11-02: Everything is a tracker
Follow-ups, meeting action points, daily work logs and client follow-ups are all "a list of records
with some fields and a status". Instead of building a separate module (tables, API, screens) for
each, they are tracker **templates**. This means much less code, and it proves the builder is
flexible enough.

## 2026-11-02: NestJS + Prisma + PostgreSQL
- **NestJS:** TypeScript on both backend and frontend. Its structure (modules, controllers,
  services, guards) keeps a growing app organised and is easy to explain.
- **Prisma:** type-safe database access and simple migrations.
- **PostgreSQL:** strong JSONB support, which the custom fields depend on (next entry).

## 2026-11-02: Custom field values in one JSONB column, not EAV
EAV ("entity-attribute-value") stores one database row per field value. A record with 10 fields
becomes 10 rows, and filtering or sorting needs many joins.

Instead, each record has a `data` JSONB column, for example `{"f_12": "Acme Ltd", "f_13": 4500}`,
keyed by field id. Field definitions (type, options, required) stay in a normal `tracker_fields`
table.

- Pros: one row per record, simple reads, and a GIN index for fast lookups.
- Cons: the database can't enforce types inside the JSON, so the backend validates every write
  against the field definitions.
- Prisma can't express every JSONB filter, so those use parameterised raw SQL.

## 2026-11-02: Organisation isolation from day one
Every tenant table has `organization_id`, applied in one central place. Adding it later would mean
touching every query. Doing it now makes it impossible to forget per endpoint.

## 2026-11-02: Fixed roles first
The MVP has four fixed roles: Super Admin, Manager, Team Leader and Employee. A configurable
permissions editor is a big feature in itself, so it waits until the core works.

## 2026-11-02: Hosting (M9)
- **Frontend: Netlify** (free, ideal for a static React build).
- **Backend: Render** (Netlify can't run a long-lived Node server).
- **Database: Neon** (managed Postgres with a free tier).

A Netlify proxy rewrite sends `/api/*` to the backend, so the browser sees one origin and the login
cookie works without cross-site cookie settings.

Known limit: Render's free tier sleeps when idle, so the first request takes about 30 seconds.
That's acceptable for a portfolio demo.
