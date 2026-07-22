# Repository Guidelines

## Agent Behavior

- **Act as a Senior Developer**: Provide production-ready, well-structured code with proper error handling and edge cases considered. Follow SOLID and Clean Code Principles (as using the code as documentation instead of comments). Use typescript with strict typing for type safety; avoid `any` and prefer precise types/interfaces. The code should be easy to read and understand. If too big, break in smaller and most understandable methods.
- **Respect project patterns**: Always follow the existing architecture, naming conventions, and coding patterns established in this codebase. When in doubt, search for similar implementations before creating new patterns. In doubt, search for the patterns.
- **Write minimal code**: Every line must have a purpose. If a line can be removed without changing behavior, remove it. No redundant variables, unnecessary abstractions, or verbose patterns.
- **No shortcuts**: Avoid quick hacks. Propose solutions that align with the project's long-term maintainability.
- **Code is always reviewed**: Every change will be reviewed by a human. Make it easy: explain concisely what you changed and why, provide relevant documentation links and references. Do not add comments to the code itself — all explanations go in your response message.
- **Terminals are useful for work**: For coding tasks, proactively inspect all available active terminal sessions for recent errors, warnings, test failures, build output, and other relevant logs. Treat terminal output as useful working context and re-check it after making changes. Do not interrupt, restart, or send input to a running process unless explicitly requested or necessary for the task.

## Project Structure & Module Organization

Application code lives in `src/`. `src/app/` holds Express routers and middleware; `src/services/` contains use cases grouped by domain. Put integrations in `src/clients/`, PostgreSQL access in `src/repositories/` and `src/db/`, dependency-injection wiring in `src/container/`, and shared contracts or helpers in `src/types/` and `src/utils/`. Mock fixtures are in `mock-data/`; builds go to `dist/`. Keep tests beside their subject as `*.test.ts` or under `src/test/`.

## Build, Test, and Development Commands

- `npm ci`: install the exact dependency versions from `package-lock.json`.
- `npm run dev`: load development environment files and run the API in watch mode.
- `npm run dev:mock`: start the mock server from `src/mock-server.ts`.
- `npm run typecheck`: run strict TypeScript checks without emitting files.
- `npm test`: run Vitest using `.env.test`; add `-- --run` for one CI-style pass.
- `npm run build`: type-check production sources and bundle the CommonJS application into `dist/`.
- `npm start`: run the built `dist/index.cjs` entry point.

## Coding Style & Naming Conventions

Use strict TypeScript and ES module imports. Match existing style: two-space indentation, single quotes, no semicolons, and spaces before function parentheses. Use `PascalCase` for classes/types, `camelCase` for functions/variables, and kebab-case for folders and files such as `consulta-peca-service.ts`. Expose each feature through `index.ts`; keep transport logic in routers/clients and business rules in services. No formatter or linter is configured, so preserve nearby formatting.

## Testing Guidelines

Vitest is the test runner, with Supertest available for HTTP assertions. Name tests `*.test.ts`; production builds exclude them. Cover success paths, validation failures, integration errors, and authentication boundaries. Mock ServiceNow, Gov.br, Rota, and PostgreSQL dependencies. No coverage threshold is enforced; new behavior and bug fixes should include focused tests.

## Commit & Pull Request Guidelines

Recent commits use short, imperative English subjects such as `Remove unused logic`. Keep commits focused. Pull requests should explain the problem and solution, list verification commands, link the issue, and call out API or environment-variable changes. Include request/response examples for changed endpoints.

## Security & Configuration

Use `.env.development.local` for local secrets and `.env.test` for test-only values. Never commit credentials, session encryption keys, database URLs, or tokens. When adding configuration, update the typed config loader and document the variable without publishing its value.
