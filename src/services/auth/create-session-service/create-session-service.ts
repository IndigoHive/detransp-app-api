import { randomBytes } from 'node:crypto'
import type { Platform } from '../../../types'
import type { ISessionRepository } from '../../../repositories/types/session-repository'
import type { IAnalyticsService } from '../../analytics'

export type CreateSessionInput = {
  platform: Platform
  accessToken: string
  refreshToken: string | null
  expiresIn: number
  cpf: string
  userInfo: Record<string, unknown>
}

export type CreateSessionResult = {
  sessionId: string
}

type Dependencies = {
  sessionRepository: ISessionRepository
  analyticsService: IAnalyticsService
}

export class CreateSessionService {
  private readonly sessionRepository: ISessionRepository
  private readonly analyticsService: IAnalyticsService

  constructor({ sessionRepository, analyticsService }: Dependencies) {
    this.sessionRepository = sessionRepository
    this.analyticsService = analyticsService
  }

  async run(input: CreateSessionInput): Promise<CreateSessionResult> {
    const sessionId = randomBytes(32).toString('base64url')
    const expiresAt = new Date(Date.now() + input.expiresIn * 1000)

    await this.sessionRepository.upsert({
      id: sessionId,
      cpf: input.cpf,
      platform: input.platform,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      userInfo: input.userInfo,
      expiresAt,
    })

    this.analyticsService.capture(input.cpf, 'govbr:sign_in_success')

    return { sessionId }
  }
}
