import { ErrorRequestHandler } from 'express'
import { isHttpError } from 'http-errors'

export function httpErrorHandler (): ErrorRequestHandler {
  return (err, req, res, next) => {
    if (res.headersSent || !isHttpError(err) || !err.expose) {
      return next(err)
    }

    const logger = req.scope.resolve('logger')
    logger.warn(
      { method: req.method, url: req.originalUrl, status: err.status, message: err.message },
      'Request rejected with HTTP error'
    )

    res.status(err.status).json({
      status: err.status,
      message: err.message
    })
  }
}
