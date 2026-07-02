import { randomBytes } from 'node:crypto'
import type { Platform } from '../../../types'
import type { ISessionRepository } from '../../../repositories/types/session-repository'

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
}

export class CreateSessionService {
  private readonly sessionRepository: ISessionRepository

  constructor({ sessionRepository }: Dependencies) {
    this.sessionRepository = sessionRepository
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

    return { sessionId }
  }
}
