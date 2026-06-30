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

  router.post('/validar-curso-teorico-da-cnh-do-brasil-no-detran-sp', async (req, res) => {
    const service = req.scope.resolve('validarCursoTeoricoDaCNHDoBrasilNoDetranSpService')

    const result = await service.run(req.body)

    res.status(200).json(result)
  })

  router.get('/protocols', async (req, res) => {
    const service = req.scope.resolve('listServiceCasesService')

    const result = await service.run(req.headers.authorization)

    res.status(200).json(result)
  })

  router.get('/protocols/detail', async (req, res) => {
    const service = req.scope.resolve('getServiceCaseDetailService')

    const sysId = typeof req.query.sys_id === 'string' ? req.query.sys_id : ''

    const result = await service.run(sysId)

    res.status(200).json(result)
  })

  return router
}
