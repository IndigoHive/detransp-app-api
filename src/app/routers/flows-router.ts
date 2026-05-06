import { Router } from 'express'

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function flowsRouter (): Router {
  const router = Router()

  router.get('/', async (req, res) => {
    const service = req.scope.resolve('listFlowsService')

    const result = await service.run()

    res.json(result)
  })

  router.get('/:flowId/published-flow-version', async (req, res) => {
    const flowId = req.params.flowId

    if (!UUID_V4_REGEX.test(flowId)) {
      res.status(400).json({
        message: 'Invalid flowId. Expected a UUID.'
      })

      return
    }

    const service = req.scope.resolve('getPublishedFlowVersionByFlowIdService')

    const result = await service.run(flowId)

    if (!result.data) {
      res.status(404).json({
        message: 'Published flow version not found for this flow.'
      })

      return
    }

    res.json(result)
  })

  return router
}
