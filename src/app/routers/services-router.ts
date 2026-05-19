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

  return router
}
