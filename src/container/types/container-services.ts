import type { Logger } from 'pino'
import type { Pool } from 'pg'
import type { RepositoryServices } from './repository-services'
import type { FlowServices } from '../../services/flows/flows-services'
import type { ServicesServices } from '../../services/services/services-services'
import type { AuthServices } from '../../services/auth/auth-services'
import type { Config } from '../../types'
import type { AxiosInstance } from 'axios'
import type { DetranSpServiceNowLicenciamentoClient } from '../../clients'

export type ContainerServices = RepositoryServices & FlowServices & ServicesServices & AuthServices & {
  config: Config
  pool: Pool
  logger: Logger
  serviceNowCsmClient: AxiosInstance
  detranSpServiceNowLicenciamentoClient: DetranSpServiceNowLicenciamentoClient
}
