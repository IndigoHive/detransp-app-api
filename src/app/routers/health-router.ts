import { Router } from 'express'

export function healthRouter (): Router {
  const router = Router()

  // Alive: o processo está de pé. Não verifica dependências — se checasse o banco,
  // uma oscilação do Postgres derrubaria pods saudáveis via liveness probe.
  router.get('/', (_req, res) => {
    res.status(200).json({ status: 'ok' })
  })
  router.get('/live', (_req, res) => {
    res.status(200).json({ status: 'ok' })
  })

  // Ready: path usado pelo health check do target group do ALB (fase 8.5 do guia
  // de implantação) — por isso precisa refletir se a dependência real está de pé.
  router.get('/ready', async (req, res) => {
    try {
      await req.scope.resolve('pool').query('SELECT 1')
      res.status(200).json({ status: 'ok' })
    } catch {
      res.status(503).json({ status: 'error' })
    }
  })

  return router
}
