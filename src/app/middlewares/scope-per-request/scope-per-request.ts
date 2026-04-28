import { AwilixContainer } from 'awilix'
import { RequestHandler } from 'express'
import { ContainerServices } from '../../../container'

export function scopePerRequest (container: AwilixContainer<ContainerServices>): RequestHandler {
  return (req, res, next) => {
    const scope = container.createScope()

    req.scope = scope

    res.on('finish', () => { scope.dispose() })

    next()
  }
}
