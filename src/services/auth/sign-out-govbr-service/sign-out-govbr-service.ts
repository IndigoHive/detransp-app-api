import type { Config, Platform } from '../../../types'

export type SignOutGovBrInput = {
  platform: Platform
  refreshToken: string
}

type Dependencies = {
  config: Config
}

export class SignOutGovBrService {
  private readonly config: Config

  constructor ({ config }: Dependencies) {
    this.config = config
  }

  async run (input: SignOutGovBrInput): Promise<void> {
    const { tokenUrl } = this.config.idsp
    const platformConfig = this.config.idsp[input.platform]
    const logoutUrl = tokenUrl.replace(/\/token$/, '/logout')

    const body = new URLSearchParams({
      client_id: platformConfig.clientId,
      refresh_token: input.refreshToken,
    })

    if (platformConfig.clientSecret) {
      body.set('client_secret', platformConfig.clientSecret)
    }

    const response = await fetch(logoutUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    })

    if (!response.ok && response.status !== 400) {
      const errorBody = await safeReadText(response)
      throw new Error(`GovBR logout failed (${response.status}): ${errorBody}`)
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
