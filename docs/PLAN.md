# Orbitask: Plan

The MVP is built around the custom tracker builder. Milestones are built one at a time; each ends
with the owner running it, the tests passing, and the owner confirming.

| # | Milestone | Status |
|---|-----------|--------|
| M0 | Setup and decisions | Done |
| M1 | Backend skeleton | Done |
| M2 | Auth and organisations | Done |
| M3 | Frontend shell | Done |
| M4 | Departments and employees | Not started |
| M5 | Tracker builder | Not started |
| M6 | Tracker views | Not started |
| M7 | Templates | Not started |
| M8 | Dashboard and My Work | Not started |
| M9 | Deploy | Not started |

## M0: Setup and decisions
- Owner installs Node LTS and PostgreSQL.
- Create the repo, CLAUDE.md, this plan, DECISIONS.md, README and .gitignore.

## M1: Backend skeleton
- NestJS app connected to PostgreSQL through Prisma; first migration.
- Health endpoint, `.env.example`, one consistent error response format.

## M2: Auth and organisations
- Sign up creates an organisation plus its Super Admin.
- Login, logout and "me"; JWT in an httpOnly cookie; bcrypt; login rate limit.
- Central organisation isolation, with a test that organisation A cannot read organisation B.

## M3: Frontend shell
- Vite + React + TypeScript + Tailwind, router, TanStack Query.
- Login and sign-up pages.
- Layout with a collapsible sidebar, a header and a light/dark theme.

## M4: Departments and employees
- CRUD for departments and employees.
- Role guard; deactivate an employee.

## M5: Tracker builder
- Create a tracker (name, description, icon, colour, department, visibility).
- Fields: short text, long text, number, currency, percentage, date, date-time, dropdown,
  multi-select, checkbox, email, URL, user.
- Custom statuses: name, colour, order and default.
- Record CRUD, validated against the field definitions.

## M6: Tracker views
- Table view: sort, filter, search, hide and reorder columns.
- Kanban view grouped by status; drag a card to change its status.
- Saved views.

## M7: Templates
- Built-in templates: Daily Work, Client Follow-up, Meeting Actions, Audit, HR Recruitment.
- "Save as template" for any tracker.

## M8: Dashboard and My Work
- Counts across trackers: total, overdue, due today, by status.
- Records assigned to me; recent activity.
- Seed data: a demo organisation and demo accounts for each role.
- CSV export.

## M9: Deploy
- Frontend on Netlify, with an `/api/*` proxy rewrite to the backend so cookies are same-origin.
- Backend on Render; database on Neon.
- Demo data only; README with setup and demo logins.

## Later (not in the MVP)
Formula fields, automation rules, file attachments (needs object storage), calendar and timeline
views, notifications, a projects module, a meetings module, reports with Excel/PDF export, and a
permission editor.
