import type { IdpSpGovBrSSOClient } from '../../../clients'

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
}

type Dependencies = {
  idpSpGovBrSSO: IdpSpGovBrSSOClient
}

export class ExchangeGovBrAuthorizationCodeService {
  private readonly idpSpGovBrSSO: IdpSpGovBrSSOClient

  constructor ({ idpSpGovBrSSO }: Dependencies) {
    this.idpSpGovBrSSO = idpSpGovBrSSO
  }

  async run (input: ExchangeGovBrAuthorizationCodeInput): Promise<ExchangeGovBrAuthorizationCodeResult> {
    const result = await this.idpSpGovBrSSO.generateAccessToken({
      code: input.code,
      codeVerifier: input.codeVerifier,
      ...(input.redirectUri ? { redirectUri: input.redirectUri } : {})
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
