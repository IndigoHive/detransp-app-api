import { Router } from 'express'
import { RotaCaixaPostalClient } from '../../clients/rota-caixa-postal'

export function notificacoesRouter(): Router {
  const router = Router()

  router.post('/dispositivos', async (req, res) => {
    const { accessToken } = req.session!
    const { idPlataforma, key } = req.body ?? {}

    if (!idPlataforma || !key) {
      res.status(400).json({ message: 'Missing required fields: idPlataforma, key.' })
      return
    }

    const client: RotaCaixaPostalClient = req.scope.resolve('rotaCaixaPostalClient')
    await client.registrarDispositivo(accessToken, { idPlataforma, key })
    res.status(201).end()
  })

  router.put('/dispositivos/tags', async (req, res) => {
    const { accessToken } = req.session!
    const { key, tags } = req.body ?? {}

    if (!key || !Array.isArray(tags)) {
      res.status(400).json({ message: 'Missing required fields: key, tags.' })
      return
    }

    const client: RotaCaixaPostalClient = req.scope.resolve('rotaCaixaPostalClient')
    await client.atualizarTags(accessToken, { key, tags })
    res.status(200).end()
  })

  router.get('/badge', async (req, res) => {
    const { accessToken } = req.session!
    const client: RotaCaixaPostalClient = req.scope.resolve('rotaCaixaPostalClient')
    const data = await client.getBadge(accessToken)
    res.status(200).json(data)
  })

  router.get('/mensagens', async (req, res) => {
    const { accessToken } = req.session!
    const client: RotaCaixaPostalClient = req.scope.resolve('rotaCaixaPostalClient')
    const data = await client.listarMensagens(accessToken)
    res.status(200).json(data)
  })

  router.get('/mensagens/:id', async (req, res) => {
    const { accessToken } = req.session!
    const { id } = req.params

    if (!id) {
      res.status(400).json({ message: 'Missing message id.' })
      return
    }

    const client: RotaCaixaPostalClient = req.scope.resolve('rotaCaixaPostalClient')
    const data = await client.getMensagem(accessToken, id)
    res.status(200).json(data)
  })

  return router
}
