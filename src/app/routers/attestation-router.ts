import { Router } from 'express'
import { BadRequest } from 'http-errors'
import { parseAttestationAgent } from '../../utils/attestation-agent'

// Rota pública — sem sessão gov.br. O device só gera o token de atestação
// (ver hooks/useAttestation no app); é aqui, no backend, que ele é de fato
// validado e trocado por um accessToken de acesso downstream.
export function attestationRouter (): Router {
  const router = Router()

  router.post('/validate', async (req, res) => {
    const token = req.header('X-Attestation-Token')

    if (!token) {
      throw BadRequest('Header X-Attestation-Token é obrigatório.')
    }

    const service = req.scope.resolve('validateAttestationTokenService')
    const result = await service.run(token, parseAttestationAgent(req.header('X-Platform')))

    res.status(200).json(result)
  })

  return router
}
