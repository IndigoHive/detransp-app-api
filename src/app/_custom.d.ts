import type { AwilixContainer } from 'awilix'
import type { ContainerServices } from '../container'

declare global {
  namespace Express {
    interface Request {
      id?: string
      user?: { userId: string }
      scope: AwilixContainer<ContainerServices>
    }
  }
}
