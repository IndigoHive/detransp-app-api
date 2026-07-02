import { Router } from 'express'
import { BadRequest } from 'http-errors'

function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

export function licenciamentoRouter(): Router {
  const router = Router()

  router.get('/veiculos', async (req, res) => {
    const { accessToken, cpf: userCpf } = req.session!
    if (!userCpf) {
      throw BadRequest('CPF do usuário não encontrado na sessão.')
    }
    const service = req.scope.resolve('listaVeiculosLicenciamentoService')
    const result = await service.run({ accessToken, userCpf })
    res.status(200).json(result)
  })

  router.post('/veiculos/representacao', async (req, res) => {
    const { accessToken, cpf: userCpf } = req.session!
    const renavam = asNonEmptyString(req.body?.renavam)
    const placa = asNonEmptyString(req.body?.placa)
    if (!userCpf || !renavam || !placa) {
      throw BadRequest('Campos obrigatórios ausentes: renavam e placa no corpo da requisição.')
    }
    const service = req.scope.resolve('verificaVeiculoRepresentacaoService')
    const result = await service.run({ accessToken, userCpf, renavam, placa })
    res.status(200).json(result)
  })

  router.post('/veiculos/:renavam/verificar', async (req, res) => {
    const { accessToken, cpf: userCpf } = req.session!
    const renavam = asNonEmptyString(req.params.renavam)
    const placa = asNonEmptyString(req.body?.placa)
    if (!userCpf || !renavam || !placa) {
      throw BadRequest('Campos obrigatórios ausentes: placa no corpo da requisição.')
    }
    const service = req.scope.resolve('verificaVeiculoLicenciamentoService')
    const result = await service.run({ accessToken, userCpf, renavam, placa })
    res.status(200).json(result)
  })

  router.post('/veiculos/:renavam/qr-code', async (req, res) => {
    const { accessToken, cpf: userCpf } = req.session!
    const renavam = asNonEmptyString(req.params.renavam)
    const placa = asNonEmptyString(req.body?.placa)
    if (!userCpf || !renavam || !placa) {
      throw BadRequest('Campos obrigatórios ausentes: placa no corpo da requisição.')
    }
    const service = req.scope.resolve('criaQRCodeLicenciamentoService')
    const result = await service.run({ accessToken, userCpf, renavam, placa })
    res.status(200).json(result)
  })

  router.get('/veiculos/:renavam/qr-code', async (req, res) => {
    const { accessToken, cpf: userCpf } = req.session!
    const renavam = asNonEmptyString(req.params.renavam)
    const placa = asNonEmptyString(req.query.placa)
    if (!userCpf || !renavam || !placa) {
      throw BadRequest('Campos obrigatórios ausentes: placa na query string.')
    }
    const service = req.scope.resolve('verificaQRCodeLicenciamentoService')
    const result = await service.run({ accessToken, userCpf, renavam, placa })
    res.status(200).json(result)
  })

  router.get('/veiculos/:renavam/crlv-e', async (req, res) => {
    const { accessToken, cpf: userCpf } = req.session!
    const renavam = asNonEmptyString(req.params.renavam)
    const placa = asNonEmptyString(req.query.placa)
    if (!userCpf || !renavam || !placa) {
      throw BadRequest('Campos obrigatórios ausentes: placa na query string.')
    }
    const service = req.scope.resolve('buscaCrlveLicenciamentoService')
    const result = await service.run({ accessToken, userCpf, renavam, placa })
    res.status(200).json(result)
  })

  return router
}
