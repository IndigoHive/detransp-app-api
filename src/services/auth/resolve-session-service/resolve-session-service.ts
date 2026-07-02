import { Unauthorized } from 'http-errors'
import type { ISessionRepository, Session } from '../../../repositories/types/session-repository'

export type ResolveSessionInput = {
  sessionId: string
}

export type ResolveSessionResult = {
  session: Session
}

type Dependencies = {
  sessionRepository: ISessionRepository
}

export class ResolveSessionService {
  private readonly sessionRepository: ISessionRepository

  constructor({ sessionRepository }: Dependencies) {
    this.sessionRepository = sessionRepository
  }

  async run(input: ResolveSessionInput): Promise<ResolveSessionResult> {
    const session = await this.sessionRepository.findById(input.sessionId)

    if (!session) {
      throw Unauthorized('Sessão não encontrada. Faça login novamente.')
    }

    if (new Date() >= session.expiresAt) {
      await this.sessionRepository.deleteById(input.sessionId)
      throw Unauthorized('Sessão expirada. Faça login novamente.')
    }

    return { session }
  }
}
