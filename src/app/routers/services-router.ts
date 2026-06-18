import { Router } from 'express'

export function servicesRouter (): Router {
  const router = Router()

  router.get('/get-vehicles', async (req, res) => {
    const service = req.scope.resolve('getVehiclesService')

    const result = await service.run()

    res.status(200).json(result)
  })

  router.post('/solicitar-vistoria-em-transito', async (req, res) => {
    const service = req.scope.resolve('solicitarVistoriaEmTransitoService')

    const result = await service.run(req.body)

    res.status(200).json(result)
  })

  router.get('/protocols', async (req, res) => {
    const logger = req.scope.resolve('logger')
    const service = req.scope.resolve('listServiceCasesService')

    try {
      const result = await service.run(req.headers.authorization)
      res.status(200).json(result)
    } catch (error) {
      const status = typeof (error as { status?: unknown }).status === 'number'
        ? (error as { status: number }).status
        : 500

      logger.error(
        {
          err: error,
          route: '/api/services/protocols',
          status
        },
        'Failed to list service protocols'
      )

      res.status(status).json({
        message: status === 500
          ? 'Erro ao buscar protocolos'
          : (error as Error).message
      })
    }
  })

  router.get('/protocols/detail', async (req, res) => {
    const logger = req.scope.resolve('logger')
    const service = req.scope.resolve('getServiceCaseDetailService')

    try {
      const sysId = typeof req.query.sys_id === 'string' ? req.query.sys_id : ''
      const result = await service.run(sysId)
      res.status(200).json(result)
    } catch (error) {
      const status = typeof (error as { status?: unknown }).status === 'number'
        ? (error as { status: number }).status
        : 500

      logger.error(
        {
          err: error,
          route: '/api/services/protocols/detail',
          status
        },
        'Failed to fetch protocol detail'
      )

      res.status(status).json({
        message: status === 500
          ? 'Erro ao buscar detalhe do protocolo'
          : (error as Error).message
      })
    }
  })

  return router
}
