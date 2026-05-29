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
    const { tokenUrl, clientId, clientSecret, redirectUri: defaultRedirectUri } = this.config.idsp

    if (!clientId) {
      throw new Error('IDSP clientId is not configured')
    }

    const redirectUri = input.redirectUri ?? defaultRedirectUri

    if (!redirectUri) {
      throw new Error('IDSP redirectUri is not configured')
    }

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      code: input.code,
      code_verifier: input.codeVerifier,
      redirect_uri: redirectUri,
    })

    if (clientSecret) {
      body.set('client_secret', clientSecret)
    }

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    })

    if (!response.ok) {
      const errorBody = await safeReadText(response)
      throw new Error(`GovBR token exchange failed (${response.status}): ${errorBody}`)
    }

    const payload = await response.json() as Record<string, unknown>

    const accessToken = asString(payload.access_token)

    if (!accessToken) {
      throw new Error('GovBR token response is missing access_token')
    }

    const expiresIn = asNumber(payload.expires_in)
    const idToken = asString(payload.id_token)
    const refreshToken = asString(payload.refresh_token)
    const scope = asString(payload.scope)
    const tokenType = asString(payload.token_type)

    return {
      accessToken,
      ...(expiresIn !== undefined && { expiresIn }),
      ...(idToken && { idToken }),
      ...(refreshToken && { refreshToken }),
      ...(scope && { scope }),
      ...(tokenType && { tokenType }),
      raw: payload,
    }
  }
}

async function safeReadText (response: Response): Promise<string> {
  try {
    return await response.text()
  } catch {
    return 'unable to read response body'
  }
}

function asString (value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function asNumber (value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined
}
