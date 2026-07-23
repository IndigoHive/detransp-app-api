import { ErrorRequestHandler } from 'express'
import { BadRequest } from 'http-errors'
import { MulterError } from 'multer'

// Sem esta conversão, um upload recusado pelo multer não é um `http-error` e cai no
// fallbackErrorHandler — virando um 500 "Erro interno do servidor" que esconde a causa real.
const MULTER_MESSAGES: Partial<Record<MulterError['code'], string>> = {
  LIMIT_FILE_SIZE: 'Arquivo acima do tamanho máximo permitido.',
  LIMIT_FILE_COUNT: 'Quantidade de anexos acima do permitido.',
  LIMIT_UNEXPECTED_FILE: 'Quantidade de anexos acima do permitido.',
}

export function multerErrorHandler (): ErrorRequestHandler {
  return (err, req, _res, next) => {
    if (!(err instanceof MulterError)) {
      return next(err)
    }

    // `code`/`field` são o que permite diagnosticar o upload recusado; o BadRequest não os carrega.
    const logger = req.scope.resolve('logger')
    logger.warn(
      { method: req.method, url: req.originalUrl, code: err.code, field: err.field },
      'Upload rejeitado pelo multer'
    )

    next(new BadRequest(MULTER_MESSAGES[err.code] ?? 'Não foi possível processar os anexos enviados.'))
  }
}
