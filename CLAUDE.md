# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A Next.js 16 (App Router) project management application for tracking government/ministry projects — budgets, timelines/stages, team members, locations, and a public Q&A feature per project. Auth is via NextAuth v5 (Google OAuth + credentials), Prisma/PostgreSQL for persistence, shadcn/ui (new-york style) + Tailwind v4 for UI.

## Commands

```bash
npm run dev              # start dev server (Turbopack)
npm run build            # prisma generate + next build (Turbopack)
npm run start             # start production server
npm run lint              # eslint

npm run db:local          # start local Prisma dev database
npm run db:migrate:dev    # create/apply a migration in dev
npm run db:migrate:prod   # deploy migrations in prod
npm run seed               # run prisma/seed.ts via tsx
```

There is no test suite configured in this repo.

Environment variables required (see `.env`, not committed): `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_SECRET`, `NEXTAUTH_URL`.

## Architecture

**Auth (`auth.ts`)**: NextAuth v5 config exporting `handlers`, `signIn`, `signOut`, `auth`. JWT session strategy. Two providers: Google OAuth and Credentials (email/password checked against `User.password` with bcrypt). The `jwt`/`session` callbacks stitch the Prisma `User.id` and `User.role` onto the session — always read `session.user.id` / `session.user.role` (cast through `as any`/`as {id?, role?}` since next-auth's default types don't know about them) rather than re-querying the DB for identity. Route handlers call `auth()` directly (not via a shared middleware helper) to get the session.

**Routing/middleware**: This project is on Next 16, which renamed `middleware.ts` to `proxy.ts`. `proxy.ts` re-exports `auth` from `auth.ts` as the proxy/middleware entry point, protecting all routes except `/api`, `/_next/static`, `/_next/image`, and `/favicon.ico`. Don't create a separate `middleware.ts` — edit `proxy.ts`.

**Data layer**: Prisma client is a singleton in `lib/prisma.ts` (cached on `global` in dev to survive HMR). The generated client outputs to `app/generated/prisma` (not the default `node_modules/.prisma`) — import types/enums from `@/app/generated/prisma`, not `@prisma/client`. Run `prisma generate` (via `npm run build`, or directly) after editing `prisma/schema.prisma`.

**Core domain model** (`prisma/schema.prisma`): `Project` belongs to a `Ministry` and a `Location`, has an owner (`User`), many `ProjectMember`s (role: `PROJECT_MEMBER` | `PROJECT_ADMINISTRATOR`), many `ProjectStage`s (a timeline/Gantt sequence with status), and many `Question`s (public Q&A with moderation status `PENDING`/`APPROVED`/`REJECTED`). Money fields (`totalBudget`, `spentAmount`) are Prisma `Decimal` — API responses always serialize these to strings (`.toString()`) before returning JSON, and `types/project.ts` reflects this by `Omit`-ing them from `Project` and redeclaring as `string`.

**Authorization pattern**: Global role (`User.role`: `USER`/`ADMIN`) grants blanket access; per-project permissions (e.g. editing budget/stages) require being a `PROJECT_ADMINISTRATOR` member of that specific project. This check is centralized in `lib/project-stage-auth.ts`'s `canManageProjectStages(projectId, userId, globalRole)` — reuse this helper for new project-scoped admin actions rather than reimplementing the membership lookup. See "Roles" below for the full role model and how to add new roles.

**API route conventions** (`app/api/**/route.ts`): Every handler wraps its body in try/catch, checks `isPrismaError` (`utils/is-prisma-error.ts`) first to return a 400 with the Prisma error `code`/`message`, and otherwise falls back to a 500 with `error`/`details`. Successful responses are shaped `{ data: ... }` (see `types/api.ts`'s `ApiResponse<T>`) or occasionally a bare entity — check the sibling handler before assuming which shape a given endpoint uses. Dynamic route params are async: `ctx: { params: Promise<{ id: string }> }`.

**Client data fetching**: `services/fetcher.ts` wraps `fetch`, throwing on non-OK responses using the API's `{ error }` body. `services/api/**` holds typed wrapper functions (e.g. `services/api/projects/projects.ts`) that call `fetcher` against `${getBaseUrl()}/api/...` (`utils/base-url.ts` resolves an absolute URL, needed for server-side fetches). Prefer adding new endpoints under `services/api/<domain>/` following this pattern rather than calling `fetch` directly from components.

**UI structure**: `app/layout.tsx` wraps every page in `SidebarProvider` > `AppSidebar` + `Header`. shadcn/ui primitives live in `components/ui/` (generated via `components.json`, style "new-york", no Tailwind prefix) — prefer extending/composing these over hand-rolling new primitives. Feature components are grouped by domain under `components/` (`dialog/`, `header/`, `questions/`, `table/`).

**Path aliases**: `@/*` maps to the repo root (see `tsconfig.json`), matching the shadcn alias config (`@/components`, `@/lib`, `@/ui`, `@/hooks`).

**Notifications** (`lib/notifications.ts`, `prisma/schema.prisma`'s `Notification`/`NotificationPreference` models): One row per recipient per event (no many-to-many fan-out table). Never call `prisma.notification.create` directly from a route — use the helpers in `lib/notifications.ts`: `notifyProjectMembers(projectId, fields)` (project owner + members + every global `ADMIN`), `notifyUser(userId, fields)` (single recipient), and `notifyAdmins(fields)` (every global `ADMIN` only). Every global `ADMIN` must receive a notification for every event, per product requirement — that's why `notifyProjectMembers` unions in admin ids itself and question-flow routes fire a paired `notifyUser` (personal copy) + `notifyAdmins` (observer copy) with different wording rather than one broadcast. Trigger call sites today: project create/budget/stages/members routes (`PROJECT_CREATED`/`PROJECT_UPDATED`), and question submit/moderate routes (`QUESTION_SUBMITTED`/`QUESTION_ANSWERED`/`QUESTION_REJECTED`). `GET /api/notifications` is scoped to `session.user.id` and drives both the full `/notifications` page and the header bell dropdown (`components/header/notification-bell.tsx`); `NotificationPreference` toggles (email/push/SMS/Slack) are persisted but there is no real delivery integration behind them yet — they only record intent.

## Roles

There are two independent, non-hierarchical role enums in `prisma/schema.prisma`. Neither role implies the other — a global `ADMIN` is not automatically a `PROJECT_ADMINISTRATOR` on every project, and vice versa.

### Global role — `User.role`

```prisma
enum Role {
  USER
  ADMIN
}
```

- Stored on `User.role`, one value per user account.
- Stitched onto the session in `auth.ts`'s `jwt`/`session` callbacks — read it as `session.user.role` (cast via `as any`/`as {id?, role?}`), never re-queried from the DB.
- `ADMIN` grants blanket, cross-project access (e.g. managing ministries/locations, seeing all projects). `USER` is the default for everyone else.
- Passed into authorization helpers like `canManageProjectStages(projectId, userId, globalRole)` in `lib/project-stage-auth.ts` as the `globalRole` argument.

### Project role — `ProjectMember.role`

```prisma
enum ProjectMemberRole {
  PROJECT_MEMBER
  PROJECT_ADMINISTRATOR
}
```

- Stored per `ProjectMember` row, so a user can hold a different role on each project they belong to (or no role at all if they're not a member).
- `PROJECT_ADMINISTRATOR` is required for project-scoped admin actions (editing budget, stages, etc.); `PROJECT_MEMBER` is regular membership.
- Checked via `canManageProjectStages` in `lib/project-stage-auth.ts`, which looks up the caller's `ProjectMember` row for the given `projectId` — reuse this helper (or extend it) rather than re-querying `ProjectMember` directly.

### Adding a new role value

1. Add the new value to the relevant enum in `prisma/schema.prisma` (`Role` for a global role, `ProjectMemberRole` for a project role).
2. Run `npm run db:migrate:dev` to create and apply the migration.
3. Run `prisma generate` (or `npm run build`) and update any imports from `@/app/generated/prisma` that enumerate role values (e.g. switch statements, permission maps, form `<Select>` options).
4. Update the relevant authorization check:
   - Global role: wherever `session.user.role` / `globalRole` is compared (e.g. gating in `canManageProjectStages`, page/route guards).
   - Project role: `canManageProjectStages` in `lib/project-stage-auth.ts`, and any other membership lookups.
5. Update `prisma/seed.ts` if seed data assigns roles.
6. Update UI that displays or assigns roles (e.g. member-management dialogs under `components/dialog/`, role badges in `components/table/`).
7. If the new role changes route protection, update `proxy.ts` and/or the relevant `app/api/**/route.ts` handlers — don't add a separate middleware file.