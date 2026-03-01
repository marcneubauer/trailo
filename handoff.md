# KanBang — Work Handoff Document

## Project Summary

KanBang is a self-hosted personal Trello clone built with Fastify 5 (backend), SvelteKit 2/Svelte 5 (frontend), SQLite via better-sqlite3 + Drizzle ORM, pnpm workspaces monorepo. See `CLAUDE.md` for conventions and `specs/` for full specifications.

---

## Completion Status

| Phase | Description | Status |
|-------|-------------|--------|
| 0 | Project scaffolding (git, pnpm workspace, configs) | **Done** |
| 1 | 8 specification documents in `specs/` | **Done** |
| 2 | Database schema + migrations + fractional indexing | **Done** |
| 3a | Password auth (argon2 + sessions) | **Done** |
| 3b | Passkey auth (@simplewebauthn) | **Done** |
| 4 | Board/List/Card CRUD API + integration tests | **Done** |
| 5 | SvelteKit pages + API integration | **Done** |
| 6 | Drag-and-drop (svelte-dnd-action) | **Done** |
| 7 | E2E tests (Playwright) | **Done** (20/20 passing) |
| 8 | Docker Compose + deployment | **Done** (verified) |

### Test Counts

- **70 Vitest tests passing** (16 shared + 54 API integration)
- **20 Playwright E2E tests passing** (5 auth + 6 boards + 9 lists/cards)

---

## Bugs Fixed During E2E Testing

1. **Set-Cookie stripping in API proxy** — The Fetch API's `Headers` object strips `Set-Cookie` when constructing a new `Response`. Fixed in `hooks.server.ts` by using `response.headers.getSetCookie()` and re-appending.
2. **SvelteKit layout not updating after auth** — Client-side `goto()` after login/register didn't re-run the root layout load. Fixed by using `window.location.href` for auth redirects to force full page loads.
3. **Svelte 5 event modifier syntax** — `onclick|stopPropagation` is invalid in Svelte 5. Fixed to `onclick={(e) => { e.stopPropagation(); ... }}`.

---

## Remaining Work (Optional Enhancements)

### Other Ideas
- Card descriptions (backend supports it, frontend edit UI not implemented)
- Board background colors
- Search/filter cards
- Activity log

---

## Key Files Reference

### Root
- `CLAUDE.md` — Project conventions guide
- `playwright.config.ts` — Playwright E2E config
- `vitest.workspace.ts` — 3 Vitest projects (shared, api, web)
- `docker-compose.yml` — Production deployment
- `Dockerfile.api` / `Dockerfile.web` — Multi-stage Docker builds
- `.env.example` — All env vars documented

### Shared (`packages/shared/src/`)
- `types/` — TypeScript interfaces for user, board, list, card, auth
- `validation/` — Zod schemas for auth, board, list, card
- `utils/fractional-index.ts` — `generateKeyBetween()` and `generateNKeysBetween()`

### API (`packages/api/`)
- `src/app.ts` — Fastify app factory (`buildApp()`)
- `src/server.ts` — Entry point
- `src/config.ts` — Centralized env config
- `src/db/schema/` — 6 Drizzle schema files
- `src/plugins/db.ts` — DB plugin (creates DB, runs migrations)
- `src/plugins/auth.ts` — Auth plugin (session parsing, `requireAuth`)
- `src/services/` — auth, passkey, board, list, card services
- `src/routes/` — auth, passkeys, boards, lists, cards route handlers
- `tests/integration/` — 5 test suites (auth, passkeys, boards, lists, cards)

### Web (`packages/web/src/`)
- `hooks.server.ts` — Auth check + API proxy (with Set-Cookie fix)
- `lib/api.ts` — Typed fetch wrapper
- `routes/+layout.svelte` — Nav with auth-aware username/logout
- `routes/login/+page.svelte` — Login form with passkey login button
- `routes/register/+page.svelte` — Register form
- `routes/settings/+page.svelte` — Passkey management (register, list, delete)
- `routes/boards/+page.svelte` — Board grid with create/delete
- `routes/boards/[boardId]/+page.svelte` — Full kanban board with DnD

### E2E (`e2e/`)
- `helpers.ts` — uniqueUser, registerUser, loginUser, createBoard
- `auth.spec.ts` — 5 auth flow tests
- `boards.spec.ts` — 6 board CRUD tests
- `lists-and-cards.spec.ts` — 9 list/card CRUD + persistence tests

---

## Environment Notes

- **Node**: v22.14.0 (via NVM)
- **pnpm**: v10.30.3 (via corepack)
- **NVM lazy-loading workaround**: Use direct paths:
  ```bash
  /bin/bash -c 'export PATH="/Users/mneubauer/.nvm/versions/node/v22.14.0/bin:$PATH" && <command>'
  ```
- **Drizzle schema imports**: Cross-references within `src/db/schema/` use extensionless imports (drizzle-kit CJS). The barrel `src/db/schema.ts` uses `.js` extensions (tsx runtime ESM).

---

## Specifications

All specs in `specs/` serve as the source of truth:

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
