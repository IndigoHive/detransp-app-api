import { Router } from 'express'
import type { FlowAudience } from '../../repositories/types/flow-repository'
import { sessionAuth } from '../middlewares/session-auth'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function parseAudience (value: unknown): FlowAudience {
  return value === 'sessionless' ? 'sessionless' : 'logged'
}

// Dispensa sessionAuth() só quando a audiência pedida é sessionless — nesse
// caso o próprio repositório (getPublishedFlowVersionByFlowId) já filtra por
// flow_version.published_for_sessionless = true, então não há como essa rota
// devolver conteúdo de um flow que não foi de fato publicado pra essa
// audiência, mesmo que a query string seja forjada. audience=logged (padrão)
// continua exigindo sessão normalmente.
function sessionAuthUnlessSessionless<P = { flowId: string }> () {
  const protect = sessionAuth<P>()

  return (req: Parameters<typeof protect>[0], res: Parameters<typeof protect>[1], next: Parameters<typeof protect>[2]) => {
    if (parseAudience(req.query.audience) === 'sessionless') {
      next()
      return
    }

    protect(req, res, next)
  }
}

export function flowsRouter (): Router {
  const router = Router()

  router.get('/', sessionAuth(), async (req, res) => {
    const service = req.scope.resolve('listFlowsService')

    const result = await service.run(parseAudience(req.query.audience))

    res.json(result)
  })

  // Pública — catálogo de serviços da área não logada (nome/ícone/categoria
  // dos flows disponíveis, sem dado sensível), então não exige sessão nem
  // token de atestação. Buscar o conteúdo de um flow específico continua
  // exigindo sessão em GET /:flowId abaixo.
  router.get('/sessionless', async (req, res) => {
    const service = req.scope.resolve('listFlowsService')

    const result = await service.run('sessionless')

    res.json(result)
  })

  router.get<{ flowId: string }>('/:flowId', sessionAuthUnlessSessionless<{ flowId: string }>(), async (req, res) => {
    const flowId = req.params.flowId

    if (!UUID_REGEX.test(flowId)) {
      res.status(400).json({
        message: 'Invalid flowId. Expected a UUID.'
      })

      return
    }

    const service = req.scope.resolve('getPublishedFlowVersionByFlowIdService')

    const result = await service.run(flowId, parseAudience(req.query.audience))

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
