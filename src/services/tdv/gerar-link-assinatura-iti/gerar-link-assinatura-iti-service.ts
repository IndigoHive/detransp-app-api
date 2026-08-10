import type { Config } from '../../../types'

export type GerarLinkAssinaturaItiResult = {
  link: string
  redirectUri: string
}

type Dependencies = {
  config: Config
}

export class GerarLinkAssinaturaItiService {
  private readonly config: Config

  constructor ({ config }: Dependencies) {
    this.config = config
  }

  run (): GerarLinkAssinaturaItiResult {
    const { baseUrl, clientId, redirectUri } = this.config.iti

    if (!baseUrl) {
      throw new Error('ITI baseUrl is not configured')
    }

    if (!clientId) {
      throw new Error('ITI clientId is not configured')
    }

    if (!redirectUri) {
      throw new Error('ITI redirectUri is not configured')
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'sign'
    })

    const url = new URL('/oauth2.0/authorize', baseUrl)
    url.search = params.toString()

    return {
      link: url.toString(),
      redirectUri
    }
  }
}
