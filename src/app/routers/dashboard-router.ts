import { Router } from 'express'
import { isAxiosError } from 'axios'
import { UnauthorizedError } from '../../utils/token'

function handleError(res: import('express').Response, error: unknown): void {
  if (error instanceof UnauthorizedError) {
    res.status(401).json({ error: error.message })
    return
  }
  if (isAxiosError(error) && error.response) {
    res.status(error.response.status).json({ error: error.response.data ?? 'ServiceNow error' })
    return
  }
  const message = error instanceof Error ? error.message : 'Internal server error'
  res.status(500).json({ error: message })
}

export function dashboardRouter(): Router {
  const router = Router()

  router.get('/meus-veiculos', async (req, res) => {
    try {
      const service = req.scope.resolve('getMeusVeiculosService')
      const result = await service.run(req.headers.authorization)
      res.status(200).json(result)
    } catch (error) {
      handleError(res, error)
    }
  })

  router.get('/dados-condutor', async (req, res) => {
    try {
      const service = req.scope.resolve('getDadosCondutorService')
      const { payload = '' } = req.query as Record<string, string | undefined>
      const result = await service.run(req.headers.authorization, payload)
      res.status(200).json(result)
    } catch (error) {
      handleError(res, error)
    }
  })

  router.get('/pontuacao-cnh', async (req, res) => {
    try {
      const service = req.scope.resolve('getPontuacaoCnhService')
      const result = await service.run(req.headers.authorization)
      res.status(200).json(result)
    } catch (error) {
      handleError(res, error)
    }
  })

  router.get('/debitos-pendentes', async (req, res) => {
    try {
      const service = req.scope.resolve('getDebitosPendentesService')
      const { veicnum } = req.query as Record<string, string | undefined>
      const result = await service.run(req.headers.authorization, veicnum)
      res.status(200).json(result)
    } catch (error) {
      handleError(res, error)
    }
  })

  router.get('/detalhes-pontuacao-cnh', async (req, res) => {
    try {
      const service = req.scope.resolve('getDetalhesPontosCnhService')
      const { meses, tipoDoc } = req.query as Record<string, string | undefined>
      const result = await service.run(req.headers.authorization, meses, tipoDoc)
      res.status(200).json(result)
    } catch (error) {
      handleError(res, error)
    }
  })

  router.get('/lista-multas', async (req, res) => {
    try {
      const service = req.scope.resolve('getListaMultasService')
      const result = await service.run(req.headers.authorization)
      res.status(200).json(result)
    } catch (error) {
      handleError(res, error)
    }
  })

  router.get('/multas', async (req, res) => {
    try {
      const service = req.scope.resolve('getDetalhesMultaService')
      const { auto = '', idVeiculo = '' } = req.query as Record<string, string | undefined>
      const result = await service.run(req.headers.authorization, auto, idVeiculo)
      res.status(200).json(result)
    } catch (error) {
      handleError(res, error)
    }
  })

  return router
}
