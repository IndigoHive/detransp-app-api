import { Router } from 'express'

export function tdvRouter (): Router {
  const router = Router()

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

  router.get('/comprador-cpf', async (req, res) => {
    const { accessToken } = req.session!
    const service = req.scope.resolve('compradorCpfService')
    const cpf = req.query.cpf as string
    const result = await service.run(accessToken, { cpf })
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

  router.post('/informar-dados-venda', async (req, res) => {
    const { accessToken } = req.session!
    const service = req.scope.resolve('informarDadosVendaService')
    const result = await service.run(accessToken, req.body)
    res.status(200).json(result)
  })

  router.post('/confirmar-intencao-venda', async (req, res) => {
    const { accessToken } = req.session!
    const service = req.scope.resolve('confirmarIntencaoVendaService')
    const result = await service.run(accessToken, req.body)
    res.status(200).json(result)
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
    // Only the PIX screen should actually mint/renew a charge — the débitos-list screen
    // (reached first, before the buyer opts to pay) must only read an existing one, or the
    // PIX's short expiration window starts ticking before the QR is ever shown.
    const gerarQrCode = req.query.gerarQrCode === 'true'
    const result = await service.run(accessToken, { codigoTransferencia, gerarQrCode })
    res.status(200).json(result)
  })

  router.post('/prova-vida', async (req, res) => {
    const { accessToken } = req.session!
    const service = req.scope.resolve('provaVidaService')
    const result = await service.run(accessToken, req.body)
    res.status(200).json(result)
  })

  router.get('/link-assinatura-iti', async (req, res) => {
    const service = req.scope.resolve('gerarLinkAssinaturaItiService')
    const result = service.run()
    res.status(200).json(result)
  })

  return router
}
