import type { Config } from '../../../types'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'
import type { IAnalyticsService } from '../../analytics'

export type GerarLinkAssinaturaItiResult = {
  link: string
  redirectUri: string
}

type Dependencies = {
  config: Config
  analyticsService: IAnalyticsService
}

export class GerarLinkAssinaturaItiService {
  private readonly config: Config
  private readonly analyticsService: IAnalyticsService

  constructor ({ config, analyticsService }: Dependencies) {
    this.config = config
    this.analyticsService = analyticsService
  }

  run (authorizationHeader: string | undefined): GerarLinkAssinaturaItiResult {
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

    const cpf = extractCpfFromToken(extractBearerToken(authorizationHeader))
    this.analyticsService.capture(cpf, 'tdv:signature_link_generate')

    return {
      link: url.toString(),
      redirectUri
    }
  }
}
