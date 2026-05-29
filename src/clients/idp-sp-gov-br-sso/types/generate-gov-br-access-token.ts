export type GenerateGovBrAccessTokenCommand = {
  code: string
  codeVerifier: string
  redirectUri?: string
}

export type GenerateGovBrAccessTokenResult = {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  id_token?: string
  scope?: string
}
