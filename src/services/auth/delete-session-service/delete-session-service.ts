import type { Config, Platform } from '../../../types'
import type { ISessionRepository } from '../../../repositories/types/session-repository'

export type DeleteSessionInput = {
  sessionId: string
  platform: Platform
  refreshToken: string | null
}

type Dependencies = {
  sessionRepository: ISessionRepository
  config: Config
}

export class DeleteSessionService {
  private readonly sessionRepository: ISessionRepository
  private readonly config: Config

  constructor({ sessionRepository, config }: Dependencies) {
    this.sessionRepository = sessionRepository
    this.config = config
  }

  async run(input: DeleteSessionInput): Promise<void> {
    // Best-effort gov.br logout using the stored refresh token
    if (input.refreshToken) {
      try {
        await this.callGovBrLogout(input.platform, input.refreshToken)
      } catch {
        // Silent — refresh token may be invalid; local session is still removed
      }
    }

    await this.sessionRepository.deleteById(input.sessionId)
  }

  private async callGovBrLogout(platform: Platform, refreshToken: string): Promise<void> {
    const { tokenUrl } = this.config.idsp
    const platformConfig = this.config.idsp[platform]
    const logoutUrl = tokenUrl.replace(/\/token$/, '/logout')

    const body = new URLSearchParams({
      client_id: platformConfig.clientId,
      refresh_token: refreshToken,
    })

    if (platformConfig.clientSecret) {
      body.set('client_secret', platformConfig.clientSecret)
    }

    await fetch(logoutUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    })
  }
}
