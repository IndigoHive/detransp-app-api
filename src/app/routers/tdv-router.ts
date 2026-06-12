import { Router } from 'express'

export function tdvRouter (): Router {
  const router = Router()

  // Verificar estado TDV - determines the next action for the user
  router.get('/verificar-estado', async (req, res) => {
    const service = req.scope.resolve('verificarEstadoTdvService')
    const result = await service.run(req.headers.authorization)
    res.status(200).json(result)
  })

  // Consulta Veículos - list seller's vehicles
  router.get('/veiculos', async (req, res) => {
    const service = req.scope.resolve('consultaVeiculosTdvService')
    const result = await service.run(req.headers.authorization)
    res.status(200).json(result)
  })

  // Análise Requisitos - check vehicle requirements
  router.post('/analise-requisitos', async (req, res) => {
    const service = req.scope.resolve('analiseRequisitosService')
    const result = await service.run(req.headers.authorization, req.body)
    res.status(200).json(result)
  })

  // Validação Comprador - validate buyer data
  router.post('/validacao-comprador', async (req, res) => {
    const service = req.scope.resolve('validacaoCompradorService')
    const result = await service.run(req.headers.authorization, req.body)
    res.status(200).json(result)
  })

  // Validação Venda - validate sale data (price, km, plate check)
  router.post('/validacao-venda', async (req, res) => {
    const service = req.scope.resolve('validacaoVendaService')
    const result = await service.run(req.headers.authorization, req.body)
    res.status(200).json(result)
  })

  // Criar TDV - create the transfer
  router.post('/criar', async (req, res) => {
    const service = req.scope.resolve('criarTdvService')
    const result = await service.run(req.headers.authorization, req.body)
    res.status(201).json(result)
  })

  // Cancelar TDV - cancel a transfer
  router.post('/cancelar', async (req, res) => {
    const service = req.scope.resolve('cancelarTdvService')
    const result = await service.run(req.headers.authorization, req.body)
    res.status(200).json(result)
  })

  // Consulta Compras - list buyer's pending purchases
  router.get('/compras', async (req, res) => {
    const service = req.scope.resolve('consultaComprasService')
    const result = await service.run(req.headers.authorization)
    res.status(200).json(result)
  })

  // Confirmar Compra - buyer confirms purchase
  router.post('/confirmar-compra', async (req, res) => {
    const service = req.scope.resolve('confirmarCompraService')
    const result = await service.run(req.headers.authorization, req.body)
    res.status(200).json(result)
  })

  // Valida Assinatura - validate ITI digital signature (buyer or seller)
  router.post('/valida-assinatura', async (req, res) => {
    const service = req.scope.resolve('validaAssinaturaService')
    const result = await service.run(req.headers.authorization, req.body)
    res.status(200).json(result)
  })

  // Consulta Débitos - get debts and PIX QR code for payment
  router.get('/consulta-debitos', async (req, res) => {
    const service = req.scope.resolve('consultaDebitosService')
    const codigoTransferencia = req.query.codigoTransferencia as string
    const result = await service.run(req.headers.authorization, { codigoTransferencia })
    res.status(200).json(result)
  })

  return router
}
