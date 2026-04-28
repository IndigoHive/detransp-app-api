import { Router } from 'express'

export function flowsRouter (): Router {
  const router = Router()

  router.get('/', async (req, res) => {
    const service = req.scope.resolve('listFlowsService')

    const result = await service.run()

    res.json(result)
  })

  return router
}
