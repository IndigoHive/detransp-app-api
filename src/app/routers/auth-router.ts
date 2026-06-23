import { Router } from 'express'
import { BadRequest, Unauthorized } from 'http-errors'
import type { Platform } from '../../types'

const VALID_PLATFORMS: Platform[] = ['android', 'ios']

function asPlatform (value: unknown): Platform | null {
  if (typeof value === 'string' && VALID_PLATFORMS.includes(value as Platform)) {
    return value as Platform
  }
  return null
}

export function authRouter (): Router {
  const router = Router()

  router.post('/govbr/authorization-url', (req, res) => {
    const platform = asPlatform(req.body?.platform)

    if (!platform) {
      throw BadRequest('O campo platform é obrigatório (android | ios).')
    }

    const service = req.scope.resolve('generateGovBrAuthorizationUrlService')

    const result = service.run({ ...req.body, platform })

    res.status(200).json(result)
  })

  router.post('/govbr/token', async (req, res) => {
    const platform = asPlatform(req.body?.platform)
    const code = asNonEmptyString(req.body?.code)
    const codeVerifier = asNonEmptyString(req.body?.codeVerifier)
    const redirectUri = asOptionalString(req.body?.redirectUri)

    if (!platform) {
      throw BadRequest('O campo platform é obrigatório (android | ios).')
    }

    if (!code || !codeVerifier) {
      throw BadRequest('Os campos code e codeVerifier são obrigatórios.')
    }

    const service = req.scope.resolve('exchangeGovBrAuthorizationCodeService')

    const result = await service.run({
      platform,
      code,
      codeVerifier,
      ...(redirectUri && { redirectUri }),
    })

    res.status(200).json(result)
  })

  router.get('/govbr/userinfo', async (req, res) => {
    const accessToken =
      getBearerToken(req.headers.authorization) ||
      asOptionalString(req.query.accessToken)

    if (!accessToken) {
      throw Unauthorized('Token de acesso ausente. Use Authorization: Bearer <token>.')
    }

    const service = req.scope.resolve('getGovBrUserInfoService')
    const result = await service.run({ accessToken })
    res.status(200).json(result)
  })

  router.get('/dev-callback', (req, res) => {
    const { code, error, error_description: errorDescription } = req.query

    if (error) {
      res.status(400).send(`
        <h2>Erro no login</h2>
        <p><strong>Erro:</strong> ${error}</p>
        <p><strong>Descrição:</strong> ${errorDescription ?? 'N/A'}</p>
      `)
      return
    }

    res.send(`
      <h2>✅ Login realizado com sucesso!</h2>
      <p><strong>Authorization Code:</strong></p>
      <textarea rows="4" cols="80" onclick="this.select()">${code}</textarea>
      <br/><br/>
      <p>Copie o código acima e use no <code>POST /auth/govbr/token</code>:</p>
      <pre>{
  "code": "${code}",
  "codeVerifier": "SEU_CODE_VERIFIER_AQUI"
}</pre>
    `)
  })

  return router
}

function asNonEmptyString (value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

function asOptionalString (value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function getBearerToken (authorizationHeader: string | undefined): string | undefined {
  if (!authorizationHeader) return undefined
  const [scheme, token] = authorizationHeader.split(' ')
  return scheme?.toLowerCase() === 'bearer' && token ? token : undefined
}
