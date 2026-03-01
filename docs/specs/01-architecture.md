# KanBang — Architecture

## Monorepo Layout

```
kanbang/
├── packages/
│   ├── shared/     @kanbang/shared   — Types, Zod schemas, utilities
│   ├── api/        @kanbang/api      — Fastify REST API
│   └── web/        @kanbang/web      — SvelteKit frontend
├── e2e/                              — Playwright E2E tests
├── docs/specs/                       — Specification documents
└── (root configs)                    — TS, ESLint, Prettier, Vitest, Docker
```

## Package Dependency Graph

```
@kanbang/web  ──→  @kanbang/shared
@kanbang/api  ──→  @kanbang/shared
```

`shared` has no internal dependencies. `api` and `web` are independent of each other.

## Data Flow

### Server-Side Rendered Pages

```
Browser → SvelteKit (SSR) → Fastify API → SQLite
           +page.server.ts    REST JSON     Drizzle ORM
           load() function    /api/v1/*     better-sqlite3
```

1. Browser requests a page from SvelteKit
2. SvelteKit's `+page.server.ts` `load()` function fetches data from the Fastify API (server-to-server within Docker)
3. Fastify queries SQLite via Drizzle ORM and returns JSON
4. SvelteKit renders the page with data and sends HTML to the browser

### Client-Side Interactions (drag-and-drop, CRUD)

```
Browser → SvelteKit client JS → Fastify API → SQLite
           fetch(/api/v1/*)      REST JSON     Drizzle ORM
           optimistic update
```

1. User performs an action (e.g., drags a card)
2. Client-side JS optimistically updates the UI
3. A fetch call hits the Fastify API to persist the change
4. On failure, the UI rolls back

## Deployment Topology (Docker Compose)

```
┌─────────────────────────────────────────┐
│  Docker Host                            │
│                                         │
│  ┌──────────┐     ┌──────────┐         │
│  │   web    │────→│   api    │         │
│  │ :3000    │     │ :3001    │         │
│  └──────────┘     └────┬─────┘         │
│                        │                │
│                   ┌────▼─────┐         │
│                   │ SQLite   │         │
│                   │ (volume) │         │
│                   └──────────┘         │
└─────────────────────────────────────────┘
```

- **web** (SvelteKit, adapter-node): Serves the frontend on port 3000. Proxies API calls to `http://api:3001` in server-side load functions.
- **api** (Fastify): Serves the REST API on port 3001. Reads/writes the SQLite database file.
- **SQLite volume**: A Docker named volume at `/app/data/kanbang.db` shared only with the `api` service.

## Environment Variables

| Variable | Service | Required | Description |
|----------|---------|----------|-------------|
| `DATABASE_URL` | api | Yes | Path to SQLite file |
| `SESSION_SECRET` | api | Yes | Secret for signing session cookies (min 32 chars) |
| `API_PORT` | api | No | Port for Fastify (default: 3001) |
| `API_HOST` | api | No | Bind host (default: 0.0.0.0) |
| `RP_ID` | api | Yes | WebAuthn Relying Party ID (hostname) |
| `RP_NAME` | api | No | WebAuthn display name (default: KanBang) |
| `RP_ORIGIN` | api | Yes | WebAuthn expected origin |
| `CORS_ORIGIN` | api | No | Allowed CORS origin (default: http://localhost:5173) |
| `API_URL` | web | Yes | Internal URL to reach the API |
| `ORIGIN` | web | Yes | SvelteKit origin for CSRF protection |
| `PORT` | web | No | SvelteKit port (default: 3000) |
