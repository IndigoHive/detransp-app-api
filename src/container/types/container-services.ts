import type { Logger } from 'pino'
import type { Pool } from 'pg'
import type { RepositoryServices } from './repository-services'
import type { FlowServices } from '../../services/flows/flows-services'
import type { ServicesServices } from '../../services/services/services-services'
import type { AuthServices } from '../../services/auth/auth-services'
import type { DashboardServices } from '../../services/dashboard/dashboard-services'
import type { Clients, DetranSpServiceNowLicenciamentoClient } from '../../clients'
import type { RotaCaixaPostalClient } from '../../clients/rota-caixa-postal'
import type { Config } from '../../types'

export type ContainerServices = RepositoryServices & FlowServices & ServicesServices & AuthServices & DashboardServices & Clients & {
  config: Config
  pool: Pool
  logger: Logger
  detranSpServiceNowLicenciamentoClient: DetranSpServiceNowLicenciamentoClient
  rotaCaixaPostalClient: RotaCaixaPostalClient
}
