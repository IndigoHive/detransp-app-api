import type { Config } from '../../../types'

export type GetGovBrUserInfoInput = {
  accessToken: string
}

export type GetGovBrUserInfoResult = {
  data: Record<string, unknown>
}

type Dependencies = {
  config: Config
}

export class GetGovBrUserInfoService {
  private readonly config: Config

  constructor ({ config }: Dependencies) {
    this.config = config
  }

  async run (input: GetGovBrUserInfoInput): Promise<GetGovBrUserInfoResult> {
    const userInfoUrl = this.config.idsp.userInfoUrl

    const response = await fetch(userInfoUrl, {
      headers: {
        authorization: `Bearer ${input.accessToken}`
      }
    })

    if (!response.ok) {
      const errorBody = await safeReadText(response)

      throw new Error(`GovBR userinfo request failed (${response.status}): ${errorBody}`)
    }

    const payload = await response.json() as Record<string, unknown>

    return {
      data: payload,
    }
  }
}

async function safeReadText (response: Response): Promise<string> {
  try {
    return await response.text()
  } catch {
    return 'Unable to read response body'
  }
}
