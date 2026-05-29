# DetranSP App API

## Project Context

This is the **detransp-app-api** — a backend serving a React Native mobile app for Detran-SP digital services. It uses a **Server-Driven UI** approach where flows define both UI and behavior.

**Sister repositories:**
- `cogfy-detran` — production reference project (WhatsApp-based, same flow-driven architecture)
- `detransp-app-editor` — admin panel for creating/managing flow schemas
- `detransp-app` — React Native mobile client

## Architecture

- **Flow engine, not a traditional API** — UI is driven by backend flow definitions stored as structured schemas
- Editor creates flows → stored in Admin DB → API reads and serves them → mobile renders dynamically
- New services should be added via flow configuration, not new endpoints
- Flows here are **custom proprietary schemas** we fully control (unlike cogfy-detran which uses Meta's WhatsApp flow format)

## Code Style

- TypeScript strict mode
- Awilix for dependency injection (scoped containers per request)
- Express 5 with router-level separation
- Services as classes with a `run()` method and constructor-injected dependencies
- One service per folder with co-located types and barrel `index.ts`
- Repositories follow the same pattern: interface in `types/`, implementation at folder root

## Patterns (follow cogfy-detran as reference for code structure, NOT flow schemas)

- **Separation of concerns:** flow execution / business logic / external integrations / infrastructure
- **Clients folder** for third-party integrations (ServiceNow, Gov.BR, etc.)
- **Config** centralized via environment variables mapped in `container/config/`
- Prefer **configuration over hardcoding** — anything that could vary per service should be flow-driven
- Modular and reusable components over one-off implementations

## Build and Test

```bash
npm run dev          # development with hot-reload
npm run build        # typecheck + bundle with pkgroll
npm run typecheck    # tsc --noEmit
npm run test         # vitest with .env.test
```

## Conventions

- Use `dotenv -e .env.development.local -e .env.development` for local env loading
- Database access via `pg` + `pg-chain`; `src/db/pool.ts` exports a `Database` query wrapper, pool created in the container
- Clients use `axios` for HTTP integrations
- Logging via `pino` (registered as singleton in container)
- Do not mix flow logic with infrastructure concerns (HTTP, DB drivers)
- Do not tightly couple services — each service should be independently testable

## Auth (Gov.BR OAuth + PKCE)

The auth layer integrates with Gov.BR's identity provider. Currently stateless — no middleware protects routes. This is a known gap targeted for refactoring.
