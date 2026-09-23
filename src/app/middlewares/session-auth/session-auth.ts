import { Unauthorized } from 'http-errors'
import type { RequestHandler, ParamsDictionary } from 'express-serve-static-core'

function getBearerToken(authorizationHeader: string | undefined): string | undefined {
  if (!authorizationHeader) return undefined
  const [scheme, token] = authorizationHeader.split(' ')
  return scheme?.toLowerCase() === 'bearer' && token ? token : undefined
}

export function sessionAuth<P = ParamsDictionary, ResBody = any, ReqBody = any, ReqQuery = any>(): RequestHandler<P, ResBody, ReqBody, ReqQuery> {
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
