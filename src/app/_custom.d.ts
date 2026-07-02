import type { AwilixContainer } from 'awilix'
import type { ContainerServices } from '../container'
import type { Session } from '../repositories/types/session-repository'

declare global {
  namespace Express {
    interface Request {
      id?: string
      user?: { userId: string }
      scope: AwilixContainer<ContainerServices>
      session?: Session
    }
  }
}
