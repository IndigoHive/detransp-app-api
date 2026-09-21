import { Unauthorized } from 'http-errors'
import type { RequestHandler, ParamsDictionary } from 'express-serve-static-core'

function getBearerToken(authorizationHeader: string | undefined): string | undefined {
  if (!authorizationHeader) return undefined
  const [scheme, token] = authorizationHeader.split(' ')
  return scheme?.toLowerCase() === 'bearer' && token ? token : undefined
}

// Generic over P (route params) so this middleware doesn't force a route's
// handler into the generic ParamsDictionary shape when chained alongside it
// (e.g. router.get('/:numero', sessionAuth(), handler)) — with
// noUncheckedIndexedAccess on, that widening previously made req.params.foo
// come out as `string | undefined` in the handler even though the route
// literally has :foo.
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
