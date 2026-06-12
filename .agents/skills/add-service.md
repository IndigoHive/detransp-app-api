# Skill: Add Service

Use this skill when adding a new business operation to the detransp-app-api.

## Where

`src/services/<domain>/<operation>-<entity>-service/`

## Step 1 — Create the service folder and file

```
src/services/<domain>/<operation>-<entity>-service/
  ├── <operation>-<entity>-service.ts
  └── index.ts              # optional, add if needed by other services
```

### Pattern A — Dependencies injected via destructuring (preferred for simple services)

```typescript
// <operation>-<entity>-service.ts
import type { <ExternalClient> } from '../../../clients'

export type <Operation><Entity>Input = {
  authorizationHeader: string | undefined
  // ... other inputs
}

export type <Operation><Entity>Result = {
  // ... return shape
}

export class <Operation><Entity>Service {
  constructor(private readonly <client>: <ExternalClient>) {}

  async run(input: <Operation><Entity>Input): Promise<<Operation><Entity>Result> {
    // extract token, call client, return result
  }
}
```

### Pattern B — Multiple dependencies via typed object

```typescript
// <operation>-<entity>-service.ts
import type { Config } from '../../../container/config'
import type { <ClientA>, <ClientB> } from '../../../clients'

type Dependencies = {
  config: Config
  <clientA>: <ClientA>
  <clientB>: <ClientB>
}

export class <Operation><Entity>Service {
  private readonly config: Config
  private readonly <clientA>: <ClientA>
  private readonly <clientB>: <ClientB>

  constructor({ config, <clientA>, <clientB> }: Dependencies) {
    this.config = config
    this.<clientA> = <clientA>
    this.<clientB> = <clientB>
  }

  async run(input: InputType): Promise<OutputType> {
    // business logic
  }
}
```

## Step 2 — Register in the domain registrations file

File: `src/services/<domain>/<domain>-services.ts`

```typescript
import { asClass, asFunction, type NameAndRegistrationPair } from 'awilix'
import { <Operation><Entity>Service } from './<operation>-<entity>-service'

export type <Domain>Services = {
  // ... existing
  <operation><Entity>Service: <Operation><Entity>Service
}

export function get<Domain>Registrations(): Required<NameAndRegistrationPair<<Domain>Services>> {
  return {
    // ... existing
    // Use asFunction when the constructor takes a single client (Pattern A):
    <operation><Entity>Service: asFunction(({ <client> }) =>
      new <Operation><Entity>Service(<client>),
    ).scoped(),

    // Use asClass when the constructor takes ContainerServices or a Dependencies object (Pattern B):
    // <operation><Entity>Service: asClass(<Operation><Entity>Service).scoped(),
  }
}
```

## Rules

- Always use `.scoped()` — never `.singleton()` for business logic
- Services never call `axios` directly — they call typed client methods from `src/clients/`
- Auth token extraction uses `extractBearerToken()` and `extractCpfFromToken()` from `src/utils/token` — never parse headers manually
- Do not mix flow logic with infrastructure concerns in the same service
