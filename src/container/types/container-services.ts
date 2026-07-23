import type { Logger } from 'pino'
import type { Pool } from 'pg'
import type { RepositoryServices } from './repository-services'
import type { FlowServices } from '../../services/flows/flows-services'
import type { ProtocolsServices } from '../../services/csm-protocols/csm-protocols-services'
import type { AuthServices } from '../../services/auth/auth-services'
import type { DashboardServices } from '../../services/dashboard/dashboard-services'
import type { LicenciamentoServices } from '../../services/licenciamento/licenciamento-services'
import type { DebRestrServices } from '../../services/deb-restr/deb-restr-services'
import type { PecasServices } from '../../services/pecas/pecas-services'
import type { Clients, DetranSpServiceNowLicenciamentoClient } from '../../clients'
import type { DetranSpServiceNowDebRestrClient } from '../../clients/detran-sp-service-now-deb-restr'
import type { DetranSpServiceNowPgtoClient } from '../../clients/detran-sp-service-now-pgto'
import type { RotaCaixaPostalClient } from '../../clients/rota-caixa-postal'
import type { RotaVidaClient } from '../../clients/rota-vida'
import type { RotaCrvPecasClient } from '../../clients/rota-crv-pecas'
import type { RotaVistoriasClient } from '../../clients/rota-vistorias'
import type { TdvServices } from '../../services/tdv/tdv-services'
import type { Config } from '../../types'

export type ContainerServices = RepositoryServices & FlowServices & ProtocolsServices & AuthServices & DashboardServices & LicenciamentoServices & DebRestrServices & TdvServices & PecasServices & Clients & {
  config: Config
  pool: Pool
  logger: Logger
  detranSpServiceNowLicenciamentoClient: DetranSpServiceNowLicenciamentoClient
  detranSpServiceNowDebRestrClient: DetranSpServiceNowDebRestrClient
  detranSpServiceNowPgtoClient: DetranSpServiceNowPgtoClient
  rotaCaixaPostalClient: RotaCaixaPostalClient
  rotaVidaClient: RotaVidaClient
  rotaCrvPecasClient: RotaCrvPecasClient
  rotaVistoriasClient: RotaVistoriasClient
}
