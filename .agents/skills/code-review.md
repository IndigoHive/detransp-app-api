# Skill: Code Review

Use this skill when reviewing a pull request or diff in the detransp-app-api repository.

Evaluate every change against the five axes below. Report findings grouped by axis, each with file + line reference and a suggested fix. Each item is tagged **[BLOCKING]** (must be fixed before merge) or **[SUGGESTION]** (improvement, but not a blocker).

---

## 1. Architecture Patterns

- **[BLOCKING]** Services must be resolved via `req.scope.resolve('serviceName')` in route handlers — never instantiated with `new` in a router
- **[BLOCKING]** Services must be registered with `.scoped()` — never `.singleton()` for business logic
- **[BLOCKING]** Route handlers must contain no business logic — only: resolve service → call `run()` → return response
- **[BLOCKING]** External HTTP calls must go through a typed client in `src/clients/` — services must never call `axios` directly
- **[BLOCKING]** Auth token extraction must use `extractBearerToken()` / `extractCpfFromToken()` from `src/utils/token` — no manual header parsing
- **[SUGGESTION]** Config values should come from the container config (mapped from `process.env`) — no `process.env` access inside services or clients
- **[SUGGESTION]** Flow logic should be isolated from infrastructure concerns — a service should not mix flow graph traversal with HTTP calls or DB queries in the same method

---

## 2. Code Quality

- **[BLOCKING]** TypeScript strict mode: no `any`, no `as unknown`, explicit return types on all public class methods
- **[BLOCKING]** No unused imports, variables, or dead code
- **[BLOCKING]** Logging must be done via the injected Pino `logger` — no `console.log`
- **[SUGGESTION]** File/folder names: kebab-case for files, PascalCase for classes
- **[SUGGESTION]** Comments explain *why*, not *what* — remove obvious comments

---

## 3. Code Redundancy

- **[BLOCKING]** Token extraction and CPF parsing: always use `src/utils/token` — never reimplemented inline
- **[BLOCKING]** Error handling in routers: must use the shared `handleError()` function pattern — not a per-route custom catch block
- **[SUGGESTION]** New service: check `src/services/` — does an equivalent operation already exist that could be reused or extended?
- **[SUGGESTION]** New client method: check the existing client class for the same external API — add a method there instead of creating a parallel client
- **[SUGGESTION]** Dashboard-style services that just proxy a client call: check if the client already exposes the endpoint before adding a new service layer
- **[SUGGESTION]** Rule of three: two similar blocks may be acceptable; three or more must be extracted

---

## 4. Security

- **[BLOCKING]** Gov.BR tokens must never be logged at INFO level — only DEBUG with minimal context (no full token, no CPF)
- **[BLOCKING]** No PII (CPF, personal names, vehicle data) included in error messages returned to the client
- **[BLOCKING]** No secrets or base URLs hardcoded in source — all from environment variables via container config
- **[BLOCKING]** External API errors from `AxiosError` must be sanitized before forwarding — raw upstream responses must not be returned directly if they contain internal system details
- **[SUGGESTION]** No endpoint should allow unvalidated external input to reach a downstream service call without sanitization

---

## 5. Tests

- **[BLOCKING]** New services must have a Vitest unit test (co-located: `{service-name}.test.ts`)
- **[BLOCKING]** New endpoints must have a Supertest integration test
- **[BLOCKING]** Service unit tests must mock or stub external clients — no real HTTP calls in unit tests
- **[SUGGESTION]** Tests should cover both the happy path and the main error cases (`UnauthorizedError`, `AxiosError`, invalid input)
- **[SUGGESTION]** Test pattern: `describe('{ServiceName}', () => { it('should {behavior}', async () => { ... }) })`
