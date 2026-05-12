import { createHash, randomBytes } from 'node:crypto'
import type { Config } from '../../../types'

export type GenerateGovBrAuthorizationUrlInput = {
  state?: string
  nonce?: string
  redirectUri?: string
  scope?: string
  codeVerifier?: string
}

export type GenerateGovBrAuthorizationUrlResult = {
  authorizationUrl: string
  state: string
  nonce: string
  codeVerifier: string
  codeChallenge: string
  codeChallengeMethod: 'S256'
  redirectUri: string
  scope: string
  clientId: string
}

type Dependencies = {
  config: Config
}

export class GenerateGovBrAuthorizationUrlService {
  private readonly config: Config

  constructor ({ config }: Dependencies) {
    this.config = config
  }

  run (input: GenerateGovBrAuthorizationUrlInput = {}): GenerateGovBrAuthorizationUrlResult {
    const clientId = this.config.idsp.clientId
    const defaultRedirectUri = this.config.idsp.redirectUri
    const defaultScope = this.config.idsp.scope
    const authorizeUrl = this.config.idsp.authorizeUrl

    if (!clientId) {
      throw new Error('IDSP clientId is not configured')
    }

    const redirectUri = input.redirectUri || defaultRedirectUri

    if (!redirectUri) {
      throw new Error('IDSP redirectUri is not configured')
    }

    const state = input.state || randomString(24)
    const nonce = input.nonce || randomString(24)
    const codeVerifier = input.codeVerifier || randomString(64)
    const scope = input.scope || defaultScope
    const codeChallenge = createCodeChallenge(codeVerifier)

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope,
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    })

    return {
      authorizationUrl: `${authorizeUrl}?${params.toString()}`,
      state,
      nonce,
      codeVerifier,
      codeChallenge,
      codeChallengeMethod: 'S256',
      redirectUri,
      scope,
      clientId,
    }
  }
}

function randomString (size: number): string {
  return toBase64Url(randomBytes(size))
}

function createCodeChallenge (codeVerifier: string): string {
  const hash = createHash('sha256').update(codeVerifier).digest()

  return toBase64Url(hash)
}

function toBase64Url (buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}
