import type { Config, Platform } from '../../../types'
import type { IdpSpGovBrSSOClient } from '../../../clients'

export type ExchangeGovBrAuthorizationCodeInput = {
  platform: Platform
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
}

type Dependencies = {
  config: Config
  idpSpGovBrSSO: IdpSpGovBrSSOClient
}

export class ExchangeGovBrAuthorizationCodeService {
  private readonly config: Config
  private readonly idpSpGovBrSSO: IdpSpGovBrSSOClient

  constructor ({ config, idpSpGovBrSSO }: Dependencies) {
    this.config = config
    this.idpSpGovBrSSO = idpSpGovBrSSO
  }

  async run (input: ExchangeGovBrAuthorizationCodeInput): Promise<ExchangeGovBrAuthorizationCodeResult> {
    const platformConfig = this.config.idsp[input.platform]

    const result = await this.idpSpGovBrSSO.generateAccessToken({
      code: input.code,
      codeVerifier: input.codeVerifier,
      clientId: platformConfig.clientId,
      redirectUri: input.redirectUri ?? platformConfig.redirectUri,
      ...(platformConfig.clientSecret ? { clientSecret: platformConfig.clientSecret } : {}),
    })

    return {
      accessToken: result.access_token,
      ...(result.expires_in !== undefined ? { expiresIn: result.expires_in } : {}),
      ...(result.id_token ? { idToken: result.id_token } : {}),
      ...(result.refresh_token ? { refreshToken: result.refresh_token } : {}),
      ...(result.scope ? { scope: result.scope } : {}),
      ...(result.token_type ? { tokenType: result.token_type } : {})
    }
  }
}
