# Fuel and Oil Management

A Next.js 16 application for managing fuel, oil, station tanks, consumption, supplies, and users with role-based admin access.

## Tech stack

- Next.js 16 (App Router)
- TypeScript
- Better Auth for authentication and session management
- Drizzle ORM with PostgreSQL (`pg`)
- Tailwind CSS and shadcn/ui components
- React, Lucide icons, Sonner toast notifications

## Key features

- username/password login only
- role-based admin permissions (`admin` vs `user`)
- Dashboard overview with fuel/oil alerts and stats
- Stations management with nested tank support
- Fuel consumption and supplies recording
- Oil catalog and oil rates management
- Consumer management
- Daily balance overview

## Authentication

The app uses `better-auth` with email/password credentials and a `username` plugin.

### Default admin setup

There is an admin bootstrap endpoint at:

- `GET /api/setup`

This endpoint creates the first admin user only when the database is empty.

Default credentials:

- username: `admin`
- password: `adminadmin123`
- email: `admin@transport.gov.eg`

> Note: The login form uses the username and password fields. You can override the bootstrap password by setting `SETUP_ADMIN_PASSWORD` in `.env.local`.

## Running locally

1. Install dependencies:

```bash
pnpm install
```

2. Copy the example environment file and use a local ignored env file:

```bash
cp .env.example .env.local
```

3. Update `.env.local` if needed, especially:

```bash
DATABASE_URL=postgres://user:password@localhost:5432/dbname
BETTER_AUTH_URL=http://localhost:3000
NODE_ENV=development
```

4. Start the app:

```bash
pnpm dev
```

5. Load the app in the browser at `http://localhost:3000`.

6. If the database is empty, open `http://localhost:3000/api/setup` once to create the admin user.

## Project structure

- `app/` — Next.js routes and pages
- `components/` — reusable UI and domain components
- `lib/` — auth, session, navigation, database connection
- `app/api/` — API routes, including auth and setup
- `public/` — static assets

## Important files

- `lib/auth.ts` — Better Auth configuration
- `lib/session.ts` — server-side session helpers
- `lib/db/index.ts` — Drizzle Postgres setup
- `app/api/setup/route.ts` — admin bootstrap route
- `app/sign-in/page.tsx` — login page
- `app/dashboard/page.tsx` — main dashboard

## What still needs work

- The dashboard uses placeholder/static metric values; most cards are not backed by live DB queries.
- Navigation references admin pages such as `audit-log` and `settings`, but those pages are not present in the workspace.
- There is no sign-up UI; user creation is currently only possible via the admin setup endpoint or direct DB/Better Auth operations.
- Error handling and validation are basic in many action forms and API actions.
- There is no `.env.example` or documented database migration flow in the repository.
- Production-ready auth cookie configuration and app security should be reviewed before deployment.

## Notes

- The middleware protects `/dashboard` and redirects unauthenticated users to `/sign-in`.
- `sign-up` is blocked in middleware, so self-registration is intentionally disabled.
- Admin actions are protected by role checks in server action handlers.
