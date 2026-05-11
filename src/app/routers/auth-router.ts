import { Router } from 'express'

export function authRouter (): Router {
  const router = Router()

  router.post('/govbr/authorization-url', async (req, res) => {
    const service = req.scope.resolve('generateGovBrAuthorizationUrlService')

    const result = service.run(req.body || {})

    res.status(200).json(result)
  })

  router.post('/govbr/token', async (req, res) => {
    const code = asNonEmptyString(req.body?.code)
    const codeVerifier = asNonEmptyString(req.body?.codeVerifier)
    const redirectUri = asOptionalString(req.body?.redirectUri)

    if (!code || !codeVerifier) {
      res.status(400).json({
        message: 'Invalid request body. Fields code and codeVerifier are required.'
      })

      return
    }

    const service = req.scope.resolve('exchangeGovBrAuthorizationCodeService')

    const payload = {
      code,
      codeVerifier,
      ...(redirectUri ? { redirectUri } : {})
    }

    const result = await service.run(payload)

    res.status(200).json(result)
  })

  router.get('/dev-callback', (req, res) => {
    const code = req.query.code
    const error = req.query.error
    const errorDescription = req.query.error_description

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

  router.get('/govbr/userinfo', async (req, res) => {
    const accessToken =
      getBearerToken(req.headers.authorization) ||
      asOptionalString(req.query.accessToken)

    if (!accessToken) {
      res.status(400).json({
        message: 'Missing access token. Use Authorization: Bearer <token> or query accessToken.'
      })

      return
    }

    const service = req.scope.resolve('getGovBrUserInfoService')

    const result = await service.run({ accessToken })

    res.status(200).json(result)
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
  if (!authorizationHeader) {
    return undefined
  }

  const [scheme, token] = authorizationHeader.split(' ')

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return undefined
  }

  return token
}
