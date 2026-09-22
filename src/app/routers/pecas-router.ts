import { Router, type Request } from 'express'
import { Unauthorized } from 'http-errors'

// Resolve o accessToken (e o cpf, quando houver) a partir de duas fontes
// possíveis:
// - Sessão gov.br (Authorization: Bearer <sessionId>) — área logada.
// - Header X-Attestation-Token — área sem autenticação. A troca do token
//   bruto do device por um accessToken já aconteceu uma única vez, em
//   POST /api/attestation/validate, disparada pelo próprio
//   sessionless_start_node no início do flow (ver handleSessionlessStartNode
//   no app). O valor que chega aqui já É o accessToken — usado direto, sem
//   nova troca. Sem cpf, já que não há identidade de usuário associada.
// Isso deixa o mesmo endpoint (GET /:numero, POST /qrcode) atender as duas
// portas de entrada de um flow (start_node e sessionless_start_node), que no
// grafo levam ao mesmo nó de requisição HTTP.
async function resolveAccessTokenAndCpf (req: Request): Promise<{ accessToken: string, cpf: string | null }> {
  const [scheme, sessionId] = req.headers.authorization?.split(' ') ?? []

  if (scheme?.toLowerCase() === 'bearer' && sessionId) {
    const service = req.scope.resolve('resolveSessionService')
    const { session } = await service.run({ sessionId })
    return { accessToken: session.accessToken, cpf: session.cpf }
  }

  const attestationToken = req.header('X-Attestation-Token')

  if (attestationToken) {
    return { accessToken: attestationToken, cpf: null }
  }

  throw Unauthorized('Sessão ou token de atestação ausente.')
}

export function pecasRouter (): Router {
  const router = Router()

  router.get('/:numero', async (req, res) => {
    const { accessToken, cpf } = await resolveAccessTokenAndCpf(req)
    const service = req.scope.resolve('consultaPecaService')
    const result = await service.run(accessToken, req.params.numero, cpf)
    res.status(200).json(result)
  })

  router.post('/qrcode', async (req, res) => {
    const { accessToken, cpf } = await resolveAccessTokenAndCpf(req)
    const service = req.scope.resolve('consultaPecaService')
    const result = await service.runFromQrCode(accessToken, req.body.url, cpf)
    res.status(200).json(result)
  })

  return router
}
