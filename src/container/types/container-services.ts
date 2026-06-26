import type { Logger } from 'pino'
import type { Pool } from 'pg'
import type { RepositoryServices } from './repository-services'
import type { FlowServices } from '../../services/flows/flows-services'
import type { ServicesServices } from '../../services/services/services-services'
import type { AuthServices } from '../../services/auth/auth-services'
import type { DashboardServices } from '../../services/dashboard/dashboard-services'
import type { LicenciamentoServices } from '../../services/licenciamento/licenciamento-services'
import type { DebRestrServices } from '../../services/deb-restr/deb-restr-services'
import type { Clients, DetranSpServiceNowLicenciamentoClient } from '../../clients'
import type { DetranSpServiceNowDebRestrClient } from '../../clients/detran-sp-service-now-deb-restr'
import type { RotaCaixaPostalClient } from '../../clients/rota-caixa-postal'
import type { TdvServices } from '../../services/tdv/tdv-services'
import type { Config } from '../../types'

export type ContainerServices = RepositoryServices & FlowServices & ServicesServices & AuthServices & DashboardServices & LicenciamentoServices & DebRestrServices & TdvServices & Clients & {
  config: Config
  pool: Pool
  logger: Logger
  detranSpServiceNowLicenciamentoClient: DetranSpServiceNowLicenciamentoClient
  detranSpServiceNowDebRestrClient: DetranSpServiceNowDebRestrClient
  rotaCaixaPostalClient: RotaCaixaPostalClient
}
