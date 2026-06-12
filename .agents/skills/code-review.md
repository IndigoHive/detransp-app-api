# Skill: Code Review

Use this skill when reviewing a pull request or diff in the detransp-app-api repository.

Evaluate every change against the five axes below. Report findings grouped by axis, each with file + line reference and a suggested fix.

---

## 1. Architecture Patterns

- [ ] Services are resolved via `req.scope.resolve('serviceName')` in route handlers — never instantiated with `new` in a router
- [ ] Services are registered with `.scoped()` — never `.singleton()` for business logic
- [ ] Route handlers contain no business logic — only: resolve service → call `run()` → return response
- [ ] External HTTP calls go through a typed client in `src/clients/` — services never call `axios` directly
- [ ] Config values come from the container config (mapped from `process.env`) — no `process.env` access inside services or clients
- [ ] Flow logic is isolated from infrastructure concerns — a service does not mix flow graph traversal with HTTP calls or DB queries in the same method
- [ ] Auth token extraction uses `extractBearerToken()` / `extractCpfFromToken()` from `src/utils/token` — no manual header parsing

---

## 2. Code Quality

- [ ] TypeScript strict mode: no `any`, no `as unknown`, explicit return types on all public class methods
- [ ] No unused imports, variables, or dead code
- [ ] File/folder names: kebab-case for files, PascalCase for classes
- [ ] Comments explain *why*, not *what* — remove obvious comments
- [ ] Logging is done via the injected Pino `logger` — no `console.log`

---

## 3. Code Redundancy

- [ ] New service: check `src/services/` — does an equivalent operation already exist that could be reused or extended?
- [ ] New client method: check the existing client class for the same external API — add a method there instead of creating a parallel client
- [ ] Token extraction and CPF parsing: always use `src/utils/token` — never reimplemented inline
- [ ] Error handling in routers: use the shared `handleError()` function pattern — not a per-route custom catch block
- [ ] Dashboard-style services that just proxy a client call: check if the client already exposes the endpoint before adding a new service layer
- [ ] Rule of three: two similar blocks may be acceptable; three or more must be extracted

---

## 4. Security

- [ ] Gov.BR tokens are never logged at INFO level — only DEBUG with minimal context (no full token, no CPF)
- [ ] No PII (CPF, personal names, vehicle data) included in error messages returned to the client
- [ ] External API errors from `AxiosError` are sanitized before forwarding — raw upstream responses must not be returned directly if they contain internal system details
- [ ] No secrets or base URLs hardcoded in source — all from environment variables via container config
- [ ] No endpoint allows unvalidated external input to reach a downstream service call without sanitization

---

## 5. Tests

- [ ] New services have a Vitest unit test (co-located: `<service-name>.test.ts`)
- [ ] New endpoints have a Supertest integration test
- [ ] Service unit tests mock or stub external clients — no real HTTP calls in unit tests
- [ ] Tests cover both the happy path and the main error cases (`UnauthorizedError`, `AxiosError`, invalid input)
- [ ] Test pattern: `describe('<ServiceName>', () => { it('should <behavior>', async () => { ... }) })`
