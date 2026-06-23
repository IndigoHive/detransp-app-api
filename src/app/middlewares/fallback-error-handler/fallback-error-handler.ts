import { ErrorRequestHandler } from 'express'

export function fallbackErrorHandler (): ErrorRequestHandler {
  return (err, req, res, next) => {
    const logger = req.scope.resolve('logger')
    logger.error(err, 'Error handling request')

    if (res.headersSent) {
      return next(err)
    }

    res.status(500).json({
      status: 500,
      message: 'Erro interno do servidor. Tente novamente mais tarde.'
    })
  }
}
