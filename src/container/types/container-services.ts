import type { Logger } from 'pino'
import type { Pool } from 'pg'
import type { RepositoryServices } from './repository-services'
import type { FlowServices } from '../../services/flows/flows-services'
import type { ServicesServices } from '../../services/services/services-services'

export type ContainerServices = RepositoryServices & FlowServices & ServicesServices & {
  pool: Pool
  logger: Logger
}
