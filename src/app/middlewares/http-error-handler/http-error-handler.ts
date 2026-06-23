import { ErrorRequestHandler } from 'express'
import { isHttpError } from 'http-errors'

export function httpErrorHandler (): ErrorRequestHandler {
  return (err, req, res, next) => {
    if (res.headersSent || !isHttpError(err) || !err.expose) {
      return next(err)
    }

    res.status(err.status).json({
      status: err.status,
      message: err.message
    })
  }
}
