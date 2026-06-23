# Skill: Add External Client

Use this skill when integrating with a new external HTTP API (e.g., a new Detran ServiceNow endpoint group, a new Gov.BR service, or any third-party API).

## Where

`src/clients/{client-name}/`

## Step 1 — Create the HTTP base class

```typescript
// src/clients/{client-name}/{client-name}-http.ts
import axios, { type AxiosInstance } from 'axios'
import type { Logger } from 'pino'

const SERVICE_NAME = '{ClientName}'

export type {ClientName}HttpParams = {
  baseURL: string
  logger: Logger
  // add auth params as needed: auth: { username, password } or apiKey: string
}

export class {ClientName}Http {
  protected readonly axios: AxiosInstance
  protected readonly logger: Logger

  constructor(params: {ClientName}HttpParams) {
    this.logger = params.logger
    this.axios = axios.create({
      baseURL: params.baseURL,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
    this.setupInterceptors()
  }

  private setupInterceptors(): void {
    this.axios.interceptors.request.use((config) => {
      this.logger.debug(
        { method: config.method, service: SERVICE_NAME, url: config.url },
        `${SERVICE_NAME} HTTP request`,
      )
      return config
    })

    this.axios.interceptors.response.use(
      (response) => {
        this.logger.debug(
          { service: SERVICE_NAME, status: response.status, url: response.config.url },
          `${SERVICE_NAME} HTTP response`,
        )
        return response
      },
      (error) => {
        this.logger.error(
          { service: SERVICE_NAME, error },
          `${SERVICE_NAME} HTTP error`,
        )
        throw error
      },
    )
  }
}
```

## Step 2 — Create the typed domain client

```typescript
// src/clients/{client-name}/{client-name}-client.ts
import type { Logger } from 'pino'
import { {ClientName}Http } from './{client-name}-http'

export type {ClientName}ClientParams = {
  baseURL: string
  logger: Logger
}

export class {ClientName}Client extends {ClientName}Http {
  constructor(params: {ClientName}ClientParams) {
    super(params)
  }

  async get{Resource}(token: string, param?: string): Promise<unknown> {
    const response = await this.axios.get<unknown>('/api/endpoint', {
      headers: { Authorization: `Bearer ${token}` },
      params: param ? { param } : undefined,
    })
    return response.data
  }
}
```

## Step 3 — Register in the DI container

File: `src/container/create-container/create-container.ts`

```typescript
// In createContainer():
container.register({
  {clientName}: asFunction(({ config, logger }) =>
    new {ClientName}Client({
      baseURL: config.{clientName}.baseUrl,
      logger,
    }),
  ).scoped(),
})
```

## Step 4 — Add config

File: `src/container/config/` (find the existing config file)

```typescript
{clientName}: {
  baseUrl: process.env.{CLIENT_NAME}_BASE_URL ?? '',
}
```

## Step 5 — Add to ContainerServices type

File: `src/container/create-container/create-container.ts` or the `ContainerServices` type definition:

```typescript
{clientName}: {ClientName}Client
```

## Testing

- Unit tests for services that use this client should stub the client methods via `vi.fn()`
- Do not write integration tests that call the real external API in CI
- Verify the interceptor logs by checking that `logger.debug` is called (spy on it)

## Rules

- All external HTTP calls go through the client class — services never call `axios` directly
- Log requests and responses at DEBUG level only — no PII (tokens, CPF, personal data) in log messages
- Throw errors from the interceptor — do not swallow them — the calling service handles error mapping
- Config values come from `process.env` via the container config — never hardcoded in the client
- Reference: `src/clients/detran-sp-service-now/detran-sp-service-now-http.ts` for the full interceptor pattern
