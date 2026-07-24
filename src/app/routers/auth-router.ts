import { Router } from 'express'
import { BadRequest, Unauthorized } from 'http-errors'
import type { Platform } from '../../types'
import { extractCpfFromToken } from '../../utils/token'
import { sessionAuth } from '../middlewares/session-auth'

const VALID_PLATFORMS: Platform[] = ['android', 'ios']

function asPlatform (value: unknown): Platform | null {
  if (typeof value === 'string' && VALID_PLATFORMS.includes(value as Platform)) {
    return value as Platform
  }
  return null
}

function asNonEmptyString (value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

function asOptionalString (value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
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

    const exchangeService = req.scope.resolve('exchangeGovBrAuthorizationCodeService')

    const tokenResult = await exchangeService.run({
      platform,
      code,
      codeVerifier,
      ...(redirectUri && { redirectUri }),
    })

    const userInfoService = req.scope.resolve('getGovBrUserInfoService')
    const { data: userInfo } = await userInfoService.run({ accessToken: tokenResult.accessToken })

    const cpf = extractCpfFromToken(tokenResult.accessToken)

    const createSessionService = req.scope.resolve('createSessionService')
    const { sessionId } = await createSessionService.run({
      platform,
      accessToken: tokenResult.accessToken,
      refreshToken: tokenResult.refreshToken ?? null,
      expiresIn: tokenResult.expiresIn ?? 3600,
      cpf,
      userInfo,
    })

    res.status(200).json({ sessionId })
  })

  router.get('/govbr/userinfo', sessionAuth(), (req, res) => {
    if (!req.session) {
      throw Unauthorized('Sessão não encontrada.')
    }
    res.status(200).json({ data: req.session.userInfo })
  })

  router.get('/govbr/flow-user-info', sessionAuth(), async (req, res) => {
    if (!req.session) {
      throw Unauthorized('Sessão não encontrada.')
    }

    const userInfoService = req.scope.resolve('getGovBrUserInfoService')
    const { data } = await userInfoService.run({ accessToken: req.session.accessToken })

    res.status(200).json({
      cpf: data.preferred_username as string,
      full_name: `${data.given_name as string} ${data.family_name as string}`,
      email: data.email,
      phone_number: data.phone_number,
    })
  })

  router.post('/govbr/logout', sessionAuth(), async (req, res) => {
    if (!req.session) {
      throw Unauthorized('Sessão não encontrada.')
    }

    const { id: sessionId, platform, refreshToken } = req.session
    const service = req.scope.resolve('deleteSessionService')

    await service.run({
      sessionId,
      platform: platform as Platform,
      refreshToken,
    })

    res.status(204).end()
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
