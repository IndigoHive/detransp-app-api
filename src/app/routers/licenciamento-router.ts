import { Router, type Response } from 'express'
import { DetranSpServiceNowLicenciamentoError } from '../../clients/detran-sp-service-now-licenciamento/errors/detran-sp-service-now-licenciamento-error'
import { extractBearerToken, extractCpfFromToken, UnauthorizedError } from '../../utils/token'

function handleError(res: Response, error: unknown): void {
  if (error instanceof UnauthorizedError) {
    res.status(401).json({ message: error.message })
    return
  }
  if (error instanceof DetranSpServiceNowLicenciamentoError) {
    res.status(422).json({ message: error.message })
    return
  }
  const message = error instanceof Error ? error.message : 'Internal server error'
  res.status(500).json({ message })
}

function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

export function licenciamentoRouter(): Router {
  const router = Router()

  router.get('/veiculos', async (req, res) => {
    try {
      const accessToken = extractBearerToken(req.headers.authorization)
      const userCpf = asNonEmptyString(req.headers['x-cpf-usuario']) ?? extractCpfFromToken(accessToken)
      if (!userCpf) {
        res.status(400).json({ message: 'Missing required fields: Authorization, X-CPF-Usuario headers.' })
        return
      }
      const service = req.scope.resolve('listaVeiculosLicenciamentoService')
      const result = await service.run({ accessToken, userCpf })
      res.status(200).json(result)
    } catch (err) {
      handleError(res, err)
    }
  })

  router.post('/veiculos/representacao', async (req, res) => {
    try {
      const accessToken = extractBearerToken(req.headers.authorization)
      const userCpf = asNonEmptyString(req.headers['x-cpf-usuario']) ?? extractCpfFromToken(accessToken)
      const renavam = asNonEmptyString(req.body?.renavam)
      const placa = asNonEmptyString(req.body?.placa)
      if (!userCpf || !renavam || !placa) {
        res.status(400).json({ message: 'Missing required fields: Authorization header and renavam, placa in body.' })
        return
      }
      const service = req.scope.resolve('verificaVeiculoRepresentacaoService')
      const result = await service.run({ accessToken, userCpf, renavam, placa })
      res.status(200).json(result)
    } catch (err) {
      handleError(res, err)
    }
  })

  router.post('/veiculos/:renavam/verificar', async (req, res) => {
    try {
      const accessToken = extractBearerToken(req.headers.authorization)
      const userCpf = asNonEmptyString(req.headers['x-cpf-usuario']) ?? extractCpfFromToken(accessToken)
      const renavam = asNonEmptyString(req.params.renavam)
      const placa = asNonEmptyString(req.body?.placa)
      if (!userCpf || !renavam || !placa) {
        res.status(400).json({ message: 'Missing required fields: Authorization, X-CPF-Usuario headers and placa in body.' })
        return
      }
      const service = req.scope.resolve('verificaVeiculoLicenciamentoService')
      const result = await service.run({ accessToken, userCpf, renavam, placa })
      res.status(200).json(result)
    } catch (err) {
      handleError(res, err)
    }
  })

  router.post('/veiculos/:renavam/qr-code', async (req, res) => {
    try {
      const accessToken = extractBearerToken(req.headers.authorization)
      const userCpf = asNonEmptyString(req.headers['x-cpf-usuario']) ?? extractCpfFromToken(accessToken)
      const renavam = asNonEmptyString(req.params.renavam)
      const placa = asNonEmptyString(req.body?.placa)
      if (!userCpf || !renavam || !placa) {
        res.status(400).json({ message: 'Missing required fields: Authorization, X-CPF-Usuario headers and placa in body.' })
        return
      }
      const service = req.scope.resolve('criaQRCodeLicenciamentoService')
      const result = await service.run({ accessToken, userCpf, renavam, placa })
      res.status(200).json(result)
    } catch (err) {
      handleError(res, err)
    }
  })

  router.get('/veiculos/:renavam/qr-code', async (req, res) => {
    try {
      const accessToken = extractBearerToken(req.headers.authorization)
      const userCpf = asNonEmptyString(req.headers['x-cpf-usuario']) ?? extractCpfFromToken(accessToken)
      const renavam = asNonEmptyString(req.params.renavam)
      const placa = asNonEmptyString(req.query.placa)
      if (!userCpf || !renavam || !placa) {
        res.status(400).json({ message: 'Missing required fields: Authorization, X-CPF-Usuario headers and placa query param.' })
        return
      }
      const service = req.scope.resolve('verificaQRCodeLicenciamentoService')
      const result = await service.run({ accessToken, userCpf, renavam, placa })
      res.status(200).json(result)
    } catch (err) {
      handleError(res, err)
    }
  })

  router.get('/veiculos/:renavam/crlv-e', async (req, res) => {
    try {
      const accessToken = extractBearerToken(req.headers.authorization)
      const userCpf = asNonEmptyString(req.headers['x-cpf-usuario']) ?? extractCpfFromToken(accessToken)
      const renavam = asNonEmptyString(req.params.renavam)
      const placa = asNonEmptyString(req.query.placa)
      if (!userCpf || !renavam || !placa) {
        res.status(400).json({ message: 'Missing required fields: Authorization, X-CPF-Usuario headers and placa query param.' })
        return
      }
      const service = req.scope.resolve('buscaCrlveLicenciamentoService')
      const result = await service.run({ accessToken, userCpf, renavam, placa })
      res.status(200).json(result)
    } catch (err) {
      handleError(res, err)
    }
  })

  return router
}
