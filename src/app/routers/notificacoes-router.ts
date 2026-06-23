import { Router } from 'express'
import { RotaCaixaPostalClient } from '../../clients/rota-caixa-postal'
import { extractCpfFromToken } from '../../utils/token'

export function notificacoesRouter(): Router {
  const router = Router()

  /** POST /api/notificacoes/dispositivos — registra FCM token do dispositivo */
  router.post('/dispositivos', async (req, res) => {
    const accessToken = getBearerToken(req.headers.authorization)
    const { idPlataforma, key } = req.body ?? {}

    if (!accessToken || !idPlataforma || !key) {
      res.status(400).json({ message: 'Missing required fields: idPlataforma, key.' })
      return
    }

    const client: RotaCaixaPostalClient = req.scope.resolve('rotaCaixaPostalClient')
    await client.registrarDispositivo(accessToken, { idPlataforma, key })
    res.status(201).end()
  })

  /** PUT /api/notificacoes/dispositivos/tags — atualiza tópicos do dispositivo */
  router.put('/dispositivos/tags', async (req, res) => {
    const accessToken = getBearerToken(req.headers.authorization)
    const { key, tags } = req.body ?? {}

    if (!accessToken || !key || !Array.isArray(tags)) {
      res.status(400).json({ message: 'Missing required fields: key, tags.' })
      return
    }

    const client: RotaCaixaPostalClient = req.scope.resolve('rotaCaixaPostalClient')
    await client.atualizarTags(accessToken, { key, tags })
    res.status(200).end()
  })

  /** GET /api/notificacoes/badge — número de mensagens não lidas */
  router.get('/badge', async (req, res) => {
    const accessToken = getBearerToken(req.headers.authorization)
    if (!accessToken) {
      res.status(401).json({ message: 'Missing Authorization header.' })
      return
    }

    const client: RotaCaixaPostalClient = req.scope.resolve('rotaCaixaPostalClient')
    const data = await client.getBadge(accessToken)
    res.status(200).json(data)
  })

  /** GET /api/notificacoes/mensagens — lista mensagens da caixa postal */
  router.get('/mensagens', async (req, res) => {
    const accessToken = getBearerToken(req.headers.authorization)
    if (!accessToken) {
      res.status(401).json({ message: 'Missing Authorization header.' })
      return
    }

    const client: RotaCaixaPostalClient = req.scope.resolve('rotaCaixaPostalClient')
    const data = await client.listarMensagens(accessToken)
    res.status(200).json(data)
  })

  /** GET /api/notificacoes/mensagens/:id — detalhe de uma mensagem */
  router.get('/mensagens/:id', async (req, res) => {
    const accessToken = getBearerToken(req.headers.authorization)
    const { id } = req.params

    if (!accessToken || !id) {
      res.status(400).json({ message: 'Missing Authorization header or message id.' })
      return
    }

    const client: RotaCaixaPostalClient = req.scope.resolve('rotaCaixaPostalClient')
    const data = await client.getMensagem(accessToken, id)
    res.status(200).json(data)
  })

  return router
}

function getBearerToken(authorizationHeader: string | undefined): string | undefined {
  if (!authorizationHeader) return undefined
  const [scheme, token] = authorizationHeader.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return undefined
  return token
}
