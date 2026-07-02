import { Unauthorized } from 'http-errors'
import type { RequestHandler } from 'express'

function getBearerToken(authorizationHeader: string | undefined): string | undefined {
  if (!authorizationHeader) return undefined
  const [scheme, token] = authorizationHeader.split(' ')
  return scheme?.toLowerCase() === 'bearer' && token ? token : undefined
}

export function sessionAuth(): RequestHandler {
  return async (req, res, next) => {
    const sessionId = getBearerToken(req.headers.authorization)

    if (!sessionId) {
      return next(Unauthorized('Token de autorização ausente.'))
    }

    const service = req.scope.resolve('resolveSessionService')

    try {
      const { session } = await service.run({ sessionId })
      req.session = session
      next()
    } catch (err) {
      next(err)
    }
  }
}
