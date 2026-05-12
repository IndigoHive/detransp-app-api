import type { Config } from '../../../types'

export type ExchangeGovBrAuthorizationCodeInput = {
  code: string
  codeVerifier: string
  redirectUri?: string
}

export type ExchangeGovBrAuthorizationCodeResult = {
  accessToken: string
  expiresIn?: number
  idToken?: string
  refreshToken?: string
  scope?: string
  tokenType?: string
  raw: Record<string, unknown>
}

type Dependencies = {
  config: Config
}

export class ExchangeGovBrAuthorizationCodeService {
  private readonly config: Config

  constructor ({ config }: Dependencies) {
    this.config = config
  }

  async run (input: ExchangeGovBrAuthorizationCodeInput): Promise<ExchangeGovBrAuthorizationCodeResult> {
    const tokenUrl = this.config.idsp.tokenUrl
    const clientId = this.config.idsp.clientId
    const clientSecret = this.config.idsp.clientSecret
    const redirectUri = input.redirectUri || this.config.idsp.redirectUri

    if (!clientId) {
      throw new Error('IDSP clientId is not configured')
    }

    if (!redirectUri) {
      throw new Error('IDSP redirectUri is not configured')
    }

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: input.code,
      client_id: clientId,
      redirect_uri: redirectUri,
      code_verifier: input.codeVerifier,
    })

    if (clientSecret) {
      body.set('client_secret', clientSecret)
    }

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      body,
    })

    if (!response.ok) {
      const errorBody = await safeReadText(response)

      throw new Error(`GovBR token request failed (${response.status}): ${errorBody}`)
    }

    const payload = await response.json() as Record<string, unknown>

    const accessToken = asString(payload.access_token)
    const expiresIn = asNumber(payload.expires_in)
    const idToken = asString(payload.id_token)
    const refreshToken = asString(payload.refresh_token)
    const scope = asString(payload.scope)
    const tokenType = asString(payload.token_type)

    if (!accessToken) {
      throw new Error('GovBR token response does not include access_token')
    }

    return {
      accessToken,
      ...(expiresIn !== undefined
        ? { expiresIn }
        : {}),
      ...(idToken
        ? { idToken }
        : {}),
      ...(refreshToken
        ? { refreshToken }
        : {}),
      ...(scope
        ? { scope }
        : {}),
      ...(tokenType
        ? { tokenType }
        : {}),
      raw: payload
    }
  }
}

async function safeReadText (response: Response): Promise<string> {
  try {
    return await response.text()
  } catch {
    return 'Unable to read response body'
  }
}

function asString (value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function asNumber (value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined
}
