# Skill: Add API Endpoint

Use this skill when adding a new HTTP endpoint to the detransp-app-api.

## Where

`src/app/routers/<domain>-router.ts`

## Step 1 — Add the route to an existing router

```typescript
// <domain>-router.ts
import { Router } from 'express'
import { isAxiosError } from 'axios'
import { UnauthorizedError } from '../../utils/token'

function handleError(res: import('express').Response, error: unknown): void {
  if (error instanceof UnauthorizedError) {
    res.status(401).json({ error: error.message })
    return
  }
  if (isAxiosError(error) && error.response) {
    res.status(error.response.status).json({ error: error.response.data ?? 'External service error' })
    return
  }
  const message = error instanceof Error ? error.message : 'Internal server error'
  res.status(500).json({ error: message })
}

export function <domain>Router(): Router {
  const router = Router()

  router.get('/<resource>', async (req, res) => {
    try {
      const service = req.scope.resolve('<operation><Entity>Service')
      const result = await service.run(req.headers.authorization)
      res.status(200).json(result)
    } catch (error) {
      handleError(res, error)
    }
  })

  router.get('/<resource>/:id', async (req, res) => {
    try {
      const service = req.scope.resolve('<operation><Entity>Service')
      const { id } = req.params
      const result = await service.run(req.headers.authorization, id)
      res.status(200).json(result)
    } catch (error) {
      handleError(res, error)
    }
  })

  return router
}
```

## Step 2 — Register a new router (new domain only)

If this is a brand-new domain, register it in `src/app/create-app.ts`:

```typescript
import { <domain>Router } from './routers/<domain>-router'

// Inside createApp():
app.use('/api/<domain>', <domain>Router())
```

## Step 3 — Create the service

Follow the `add-service` skill to implement the service resolved in the route handler.

## Rules

- Every route handler must have a `try/catch` with `handleError()` — do not let exceptions propagate unhandled
- Route handlers only: resolve service → call `run()` → return response. No business logic in handlers
- Always resolve services via `req.scope.resolve()` — never instantiate with `new` in the router
- Pass `req.headers.authorization` to the service when the endpoint requires a Gov.BR token — do not extract the token in the router
- Query params are strings: use `req.query as Record<string, string | undefined>` and pass them to the service for validation
