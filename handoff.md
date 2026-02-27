# Trailo — Work Handoff Document

## Project Summary

Trailo is a self-hosted personal Trello clone built with Fastify 5 (backend), SvelteKit 2/Svelte 5 (frontend), SQLite via better-sqlite3 + Drizzle ORM, pnpm workspaces monorepo. See `CLAUDE.md` for conventions and `specs/` for full specifications.

---

## Completion Status

| Phase | Description | Status |
|-------|-------------|--------|
| 0 | Project scaffolding (git, pnpm workspace, configs) | **Done** |
| 1 | 8 specification documents in `specs/` | **Done** |
| 2 | Database schema + migrations + fractional indexing | **Done** |
| 3a | Password auth (argon2 + sessions) | **Done** |
| 3b | Passkey auth (@simplewebauthn) | **Not started** |
| 4 | Board/List/Card CRUD API + integration tests | **Done** |
| 5 | SvelteKit pages + API integration | **Done** |
| 6 | Drag-and-drop (svelte-dnd-action) | **Done** |
| 7 | E2E tests (Playwright) | **In Progress** |
| 8 | Docker Compose + deployment | **Not started** |

### Git Commits

1. `41f986a` — Phase 0+1+2: scaffolding, specs, schema, fractional indexing
2. `e77723d` — Phase 3: password auth system with session management
3. `b7cb5e9` — Phase 4: board/list/card CRUD API with full test coverage
4. `2250801` — (user commit) SvelteKit frontend + hooks + auth pages + board list
5. `cfc4717` — Phase 5+6: board detail page with drag-and-drop and inline editing

### Test Counts

- **58 Vitest tests passing** (16 shared + 42 API integration)
- **20 Playwright E2E tests written** (18 failing, see below)

---

## Current Work: E2E Tests (Phase 7)

### Files Created

- `playwright.config.ts` — Config with webServer for both API (port 3001) and Web (port 5173)
- `e2e/helpers.ts` — `uniqueUser()`, `registerUser()`, `loginUser()`, `createBoard()` helpers
- `e2e/auth.spec.ts` — 5 tests: register, logout+login, protected redirect, duplicate email, wrong password
- `e2e/boards.spec.ts` — 6 tests: create, list, navigate, rename, delete, empty state
- `e2e/lists-and-cards.spec.ts` — 9 tests: add/rename/delete lists, add/edit/delete cards, persistence

### Known Failures (18 of 20 tests failing)

**Issue 1: "Create" button selector ambiguity**
- `getByRole('button', { name: 'Create' })` matches both `+ Create Board` and `Create` (submit) buttons
- **Fix**: Change `e2e/helpers.ts:35` to use `{ name: 'Create', exact: true }`:
  ```typescript
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  ```

**Issue 2: Auth flow — username not visible after registration**
- After `registerUser()`, `page.waitForURL('/boards')` succeeds but `getByText(username)` fails
- The nav bar with username/logout button isn't rendering
- Root cause investigation needed — likely the `Set-Cookie` from the API proxy response isn't being properly set in the browser, so `hooks.server.ts` auth check fails on the subsequent navigation
- The proxy in `hooks.server.ts` does `new Response(response.body, { headers: response.headers })` which should forward `Set-Cookie`, but there may be a Node.js `Headers` API issue with cookie forwarding
- **Debugging approach**: Add a screenshot step after registration to see what the page actually shows. Check if the cookie is being set in the browser. Check the SvelteKit dev server logs for the auth/me call.

### Tests That Pass

- `auth.spec.ts` — "access protected page without auth redirects to login" (test 3)
- `boards.spec.ts` — "empty state when no boards" (test 6)

---

## Key Files Reference

### Root
- `CLAUDE.md` — Project conventions guide
- `playwright.config.ts` — Playwright E2E config
- `vitest.workspace.ts` — 3 Vitest projects (shared, api, web)
- `pnpm-workspace.yaml` — Workspace packages + `onlyBuiltDependencies`
- `.env.example` — All env vars documented

### Shared (`packages/shared/src/`)
- `types/` — TypeScript interfaces for user, board, list, card, auth
- `validation/` — Zod schemas for auth, board, list, card
- `utils/fractional-index.ts` — `generateKeyBetween()` and `generateNKeysBetween()`

### API (`packages/api/`)
- `src/app.ts` — Fastify app factory (`buildApp()`)
- `src/server.ts` — Entry point
- `src/config.ts` — Centralized env config
- `src/db/schema/` — 6 Drizzle schema files (users, credentials, sessions, boards, lists, cards)
- `src/db/migrations/0000_watery_felicia_hardy.sql` — Initial migration
- `src/plugins/db.ts` — DB plugin (creates DB, runs migrations)
- `src/plugins/auth.ts` — Auth plugin (session parsing, `requireAuth` decorator)
- `src/services/` — auth, board, list, card services
- `src/routes/` — auth, boards, lists, cards route handlers
- `tests/integration/` — helpers.ts + 4 test files (auth, boards, lists, cards)

### Web (`packages/web/src/`)
- `hooks.server.ts` — Auth check + API proxy
- `lib/api.ts` — Typed fetch wrapper
- `app.d.ts` — App.Locals and App.PageData types
- `routes/+layout.svelte` — Nav with auth-aware username/logout
- `routes/+layout.server.ts` — Passes `locals.user` to all pages
- `routes/+page.server.ts` — Root redirect (→ /boards or /login)
- `routes/login/+page.svelte` — Email/password login form
- `routes/register/+page.svelte` — Email/username/password register form
- `routes/boards/+page.svelte` — Board grid with create/delete
- `routes/boards/+page.server.ts` — Fetches boards from API
- `routes/boards/[boardId]/+page.svelte` — Full board view with lists, cards, DnD, inline editing
- `routes/boards/[boardId]/+page.server.ts` — Fetches board detail from API

### E2E (`e2e/`)
- `helpers.ts` — Test utilities (uniqueUser, registerUser, loginUser, createBoard)
- `auth.spec.ts` — Authentication flow tests
- `boards.spec.ts` — Board CRUD tests
- `lists-and-cards.spec.ts` — List and card CRUD tests

---

## Remaining Work

### Phase 7 Completion (E2E Tests)
1. Fix the "Create" button selector in `e2e/helpers.ts` (use `exact: true`)
2. Debug and fix the auth cookie forwarding issue (username not showing after registration)
3. Run E2E tests until all 20 pass
4. Commit

### Phase 3b: Passkey Auth (Optional/Deferred)
- @simplewebauthn/server and @simplewebauthn/browser are already installed
- Need routes: passkey register options/verify, login options/verify
- Integration tests with mocked WebAuthn ceremony
- Frontend UI for passkey registration in settings, passkey login button

### Phase 8: Docker Compose + Deployment
- Multi-stage Dockerfiles for api and web
- `docker-compose.yml` with shared SQLite volume
- The `.env.example` is already written

---

## Critical Environment Notes

- **NVM lazy-loading**: On this machine, shell commands must use direct binary paths to avoid recursive function errors:
  ```bash
  /bin/bash -c 'export PATH="/Users/mneubauer/.nvm/versions/node/v22.14.0/bin:$PATH" && <command>'
  ```
- **pnpm**: Enabled via `corepack enable pnpm` (v10.30.3)
- **Node**: v22.14.0
- **Chromium for Playwright**: Already installed at `~/Library/Caches/ms-playwright/chromium-1208`
- **onlyBuiltDependencies**: `pnpm-workspace.yaml` allows native builds for argon2, better-sqlite3, esbuild
- **Drizzle schema imports**: Cross-references within `src/db/schema/` use extensionless imports (for drizzle-kit CJS). The barrel `src/db/schema.ts` uses `.js` extensions (for tsx runtime ESM).

---

## Specifications

All specs are in `specs/` and serve as the source of truth:

| File | Content |
|------|---------|
| `00-project-overview.md` | Goals, scope, non-goals, glossary |
| `01-architecture.md` | Workspace layout, data flow, deployment topology |
| `02-database-schema.md` | All 6 tables, ER diagram, fractional indexing |
| `03-rest-api.md` | Full endpoint table with request/response shapes |
| `04-authentication.md` | Password + passkey flows, session management |
| `05-frontend-components.md` | Component tree, props/events, state management |
| `06-drag-and-drop.md` | svelte-dnd-action config, position calc, edge cases |
| `07-testing-strategy.md` | Test pyramid, tools, naming, coverage targets |
