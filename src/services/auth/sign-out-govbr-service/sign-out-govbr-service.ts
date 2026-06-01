import type { Config } from '../../../types'

export type SignOutGovBrInput = {
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
    const { tokenUrl, clientId, clientSecret } = this.config.idsp
    const logoutUrl = tokenUrl.replace(/\/token$/, '/logout')

    const body = new URLSearchParams({
      client_id: clientId,
      refresh_token: input.refreshToken,
    })

    if (clientSecret) {
      body.set('client_secret', clientSecret)
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
