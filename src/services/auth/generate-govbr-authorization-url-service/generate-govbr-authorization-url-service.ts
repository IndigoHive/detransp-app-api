import { createHash, randomBytes } from 'node:crypto'
import type { Config, Platform } from '../../../types'

export type GenerateGovBrAuthorizationUrlInput = {
  platform: Platform
  redirectUri?: string
  state?: string
  nonce?: string
  codeVerifier?: string
}

export type GenerateGovBrAuthorizationUrlResult = {
  authorizationUrl: string
  codeVerifier: string
  codeChallenge: string
  codeChallengeMethod: 'S256'
  state: string
  nonce: string
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

  run (input: GenerateGovBrAuthorizationUrlInput): GenerateGovBrAuthorizationUrlResult {
    const { authorizeUrl, scope } = this.config.idsp
    const platformConfig = this.config.idsp[input.platform]
    const clientId = platformConfig.clientId
    const redirectUri = input.redirectUri ?? platformConfig.redirectUri

    if (!clientId) {
      throw new Error('IDSP clientId is not configured')
    }

    if (!redirectUri) {
      throw new Error('IDSP redirectUri is not configured')
    }

    const codeVerifier = input.codeVerifier ?? randomBase64Url(64)
    const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url')
    const state = input.state ?? randomBase64Url(24)
    const nonce = input.nonce ?? randomBase64Url(24)

    const params = new URLSearchParams({
      client_id: clientId,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      nonce,
      prompt: 'login',
      redirect_uri: redirectUri,
      response_type: 'code',
      scope,
      state
    })

    const url = new URL(authorizeUrl)
    url.search = params.toString()

    return {
      authorizationUrl: url.toString(),
      codeVerifier,
      codeChallenge,
      codeChallengeMethod: 'S256',
      state,
      nonce,
      redirectUri,
      scope,
      clientId,
    }
  }
}

function randomBase64Url (size: number): string {
  return randomBytes(size)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}
