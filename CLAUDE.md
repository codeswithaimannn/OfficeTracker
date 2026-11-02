# Orbitask: Universal Office Tracker

A full-stack web app that any office can shape to its own work. The core feature is a no-code
**tracker builder**: an organisation creates trackers with its own fields, statuses and views. Around
it sit organisations, departments, employees, roles and a dashboard.

This is a portfolio project. The owner is a junior developer who must be able to explain every part
in a job interview. Explain decisions briefly, and never generate large amounts of code the owner has
not been walked through.

## Working agreement
- Build ONE milestone at a time, in the order of docs/PLAN.md. Do not start the next milestone until
  the current one runs, is tested, and the owner confirms.
- Before writing code for a milestone: state the plan in a few bullets and wait for approval.
- After each step: tell the owner how to run it and how to check it works.
- Ask before adding any new dependency or making a decision that is hard to reverse.
- The owner does all installs (Node, PostgreSQL, global tools). Report what is missing and wait.
- Commit small and often, with clear messages. Never commit secrets.

## Stack
- Backend: Node.js (v24), NestJS, TypeScript, Prisma ORM, REST APIs
- Database: PostgreSQL 17
- Frontend: React + TypeScript + Vite, Tailwind CSS, TanStack Query, React Router
- Tests: Vitest + Supertest (backend); Vitest + React Testing Library (frontend)
- No Docker for now. Runs locally; deployed later (see docs/DECISIONS.md).

## Layout
- backend/   NestJS app (module per feature: controller -> service -> Prisma)
- frontend/  React app
- docs/      PLAN.md (milestones), DECISIONS.md (short log of key choices and why)

## Architecture rules
- **Everything is a tracker.** Follow-ups, meeting actions, daily work, client follow-ups and similar
  are tracker *templates*, not separate modules with their own tables.
- **Custom field values live in JSONB**: `tracker_records.data`, keyed by field id. Field definitions
  live in `tracker_fields`. Every write is validated on the backend against the tracker's field
  definitions.
- **Multi-tenancy from day one.** Every tenant table has `organization_id`. The organisation filter is
  applied in ONE central place, never added by hand in each endpoint. A user must never see or change
  another organisation's data.
- Roles are fixed in the MVP (Super Admin, Manager, Team Leader, Employee) and checked by a NestJS
  guard. Configurable permissions come later.
- Raw SQL (for JSONB filters Prisma cannot express) must be parameterised (`$queryRaw` tagged
  template), never string-concatenated.
- API responses use DTOs; never return Prisma models with password hashes or internal fields.

## Security rules
- Secrets only in `.env` (untracked); keep a committed `.env.example` with placeholder values.
- bcrypt for passwords; JWT in an httpOnly cookie; rate-limit login.
- Validate all input. Escape user-written text. Return safe error messages (no stack traces).
- Public deployment uses demo data only.

## Testing rules
- Unit tests for record validation per field type, filters and dashboard counts.
- Authorisation tests: organisation A cannot read or change organisation B's data; roles are enforced.
- One end-to-end path: create a tracker from a template, add a record, move it on the kanban, and see
  the dashboard count update.

## Code style
- Small, readable functions. Meaningful names. No unexplained magic numbers.
- TypeScript strict mode everywhere.
- Frontend: function components; handle loading, empty and error states.
