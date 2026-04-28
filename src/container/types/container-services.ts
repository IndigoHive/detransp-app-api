import type { Logger } from 'pino'
import type { Pool } from 'pg'
import type { RepositoryServices } from './repository-services'
import type { FlowServices } from '../../services/flows/flows-services'

export type ContainerServices = RepositoryServices & FlowServices & {
  pool: Pool
  logger: Logger
}
