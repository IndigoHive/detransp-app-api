import { Router } from 'express'

export function dashboardRouter(): Router {
  const router = Router()

  router.get('/meus-veiculos', async (req, res) => {
    const service = req.scope.resolve('getMeusVeiculosService')
    const result = await service.run(req.headers.authorization)
    res.status(200).json(result)
  })

  router.get('/dados-condutor', async (req, res) => {
    const service = req.scope.resolve('getDadosCondutorService')
    const { payload = '' } = req.query as Record<string, string | undefined>
    const result = await service.run(req.headers.authorization, payload)
    res.status(200).json(result)
  })

  router.get('/pontuacao-cnh', async (req, res) => {
    const service = req.scope.resolve('getPontuacaoCnhService')
    const result = await service.run(req.headers.authorization)
    res.status(200).json(result)
  })

  router.get('/debitos-pendentes', async (req, res) => {
    const service = req.scope.resolve('getDebitosPendentesService')
    const { veicnum } = req.query as Record<string, string | undefined>
    const result = await service.run(req.headers.authorization, veicnum)
    res.status(200).json(result)
  })

  router.get('/detalhes-pontuacao-cnh', async (req, res) => {
    const service = req.scope.resolve('getDetalhesPontosCnhService')
    const { meses, tipoDoc } = req.query as Record<string, string | undefined>
    const result = await service.run(req.headers.authorization, meses, tipoDoc)
    res.status(200).json(result)
  })

  router.get('/lista-multas', async (req, res) => {
    const service = req.scope.resolve('getListaMultasService')
    const result = await service.run(req.headers.authorization)
    res.status(200).json(result)
  })

  router.get('/multas', async (req, res) => {
    const service = req.scope.resolve('getDetalhesMultaService')
    const { auto = '', idVeiculo = '' } = req.query as Record<string, string | undefined>
    const result = await service.run(req.headers.authorization, auto, idVeiculo)
    res.status(200).json(result)
  })

  return router
}
