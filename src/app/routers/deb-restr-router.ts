import { Router } from 'express'
import { BadRequest } from 'http-errors'

function asNonEmptyString (value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

export function debRestrRouter (): Router {
  const router = Router()

  router.post('/veiculos/:renavam/verificar', async (req, res) => {
    const { accessToken, cpf: userCpf } = req.session!
    const renavam = asNonEmptyString(req.params.renavam)
    const placa = asNonEmptyString(req.body?.placa)
    if (!userCpf || !renavam || !placa) {
      throw BadRequest('Requisição inválida.')
    }
    const service = req.scope.resolve('verificaVeiculoDebRestrService')
    const result = await service.run({ accessToken, userCpf, renavam, placa })
    res.status(200).json(result)
  })

  router.post('/veiculos/:renavam/certidao/taxa', async (req, res) => {
    const { accessToken, cpf: userCpf } = req.session!
    const renavam = asNonEmptyString(req.params.renavam)
    const placa = asNonEmptyString(req.body?.placa)
    if (!userCpf || !renavam || !placa) {
      throw BadRequest('Requisição inválida.')
    }
    const service = req.scope.resolve('consultaTaxaCertidaoService')
    const result = await service.run({ accessToken, userCpf, renavam, placa })
    res.status(200).json(result)
  })

  router.post('/veiculos/:renavam/certidao/qr-code', async (req, res) => {
    const { accessToken, cpf: userCpf } = req.session!
    const renavam = asNonEmptyString(req.params.renavam)
    const placa = asNonEmptyString(req.body?.placa)
    if (!userCpf || !renavam || !placa) {
      throw BadRequest('Requisição inválida.')
    }
    const service = req.scope.resolve('criaQRCodeCertidaoService')
    const result = await service.run({ accessToken, userCpf, renavam, placa })
    res.status(200).json(result)
  })

  router.get('/veiculos/:renavam/certidao/qr-code', async (req, res) => {
    const { accessToken, cpf: userCpf } = req.session!
    const renavam = asNonEmptyString(req.params.renavam)
    const placa = asNonEmptyString(req.query.placa)
    if (!userCpf || !renavam || !placa) {
      throw BadRequest('Requisição inválida.')
    }
    const service = req.scope.resolve('verificaQRCodeCertidaoService')
    const result = await service.run({ accessToken, userCpf, renavam, placa })
    res.status(200).json(result)
  })

  router.post('/veiculos/:renavam/certidao/documento', async (req, res) => {
    const { accessToken, cpf: userCpf } = req.session!
    const renavam = asNonEmptyString(req.params.renavam)
    const placa = asNonEmptyString(req.body?.placa)
    if (!userCpf || !renavam || !placa) {
      throw BadRequest('Requisição inválida.')
    }
    const service = req.scope.resolve('emiteCertidaoService')
    const result = await service.run({ accessToken, userCpf, renavam, placa })
    res.status(201).json(result)
  })

  router.get('/veiculos/:renavam/certidao/documento', async (req, res) => {
    const { accessToken, cpf: userCpf } = req.session!
    const renavam = asNonEmptyString(req.params.renavam)
    const placa = asNonEmptyString(req.query.placa)
    if (!userCpf || !renavam || !placa) {
      throw BadRequest('Requisição inválida.')
    }
    const service = req.scope.resolve('buscaDocumentoCertidaoService')
    const result = await service.run({ accessToken, userCpf, renavam, placa })
    res.status(200).json(result)
  })

  return router
}
