import { Router } from 'express'

export function tdvRouter (): Router {
  const router = Router()

  router.get('/verificar-estado', async (req, res) => {
    const { accessToken } = req.session!
    const service = req.scope.resolve('verificarEstadoTdvService')
    const result = await service.run(accessToken)
    res.status(200).json(result)
  })

  router.get('/veiculos', async (req, res) => {
    const { accessToken } = req.session!
    const service = req.scope.resolve('consultaVeiculosTdvService')
    const result = await service.run(accessToken)
    res.status(200).json(result)
  })

  router.post('/analise-requisitos', async (req, res) => {
    const { accessToken } = req.session!
    const service = req.scope.resolve('analiseRequisitosService')
    const result = await service.run(accessToken, req.body)
    res.status(200).json(result)
  })

  router.post('/validacao-comprador', async (req, res) => {
    const { accessToken } = req.session!
    const service = req.scope.resolve('validacaoCompradorService')
    const result = await service.run(accessToken, req.body)
    res.status(200).json(result)
  })

  router.post('/validacao-venda', async (req, res) => {
    const { accessToken } = req.session!
    const service = req.scope.resolve('validacaoVendaService')
    const result = await service.run(accessToken, req.body)
    res.status(200).json(result)
  })

  router.post('/criar', async (req, res) => {
    const { accessToken } = req.session!
    const service = req.scope.resolve('criarTdvService')
    const result = await service.run(accessToken, req.body)
    res.status(201).json(result)
  })

  router.post('/cancelar', async (req, res) => {
    const { accessToken } = req.session!
    const service = req.scope.resolve('cancelarTdvService')
    const result = await service.run(accessToken, req.body)
    res.status(200).json(result)
  })

  router.get('/compras', async (req, res) => {
    const { accessToken } = req.session!
    const service = req.scope.resolve('consultaComprasService')
    const result = await service.run(accessToken)
    res.status(200).json(result)
  })

  router.post('/confirmar-compra', async (req, res) => {
    const { accessToken } = req.session!
    const service = req.scope.resolve('confirmarCompraService')
    const result = await service.run(accessToken, req.body)
    res.status(200).json(result)
  })

  router.post('/valida-assinatura', async (req, res) => {
    const { accessToken } = req.session!
    const service = req.scope.resolve('validaAssinaturaService')
    const result = await service.run(accessToken, req.body)
    res.status(200).json(result)
  })

  router.get('/consulta-debitos', async (req, res) => {
    const { accessToken } = req.session!
    const service = req.scope.resolve('consultaDebitosService')
    const codigoTransferencia = req.query.codigoTransferencia as string
    const result = await service.run(accessToken, { codigoTransferencia })
    res.status(200).json(result)
  })

  router.post('/prova-vida', async (req, res) => {
    const { accessToken } = req.session!
    const service = req.scope.resolve('provaVidaService')
    const result = await service.run(accessToken, req.body)
    res.status(200).json(result)
  })

  return router
}
