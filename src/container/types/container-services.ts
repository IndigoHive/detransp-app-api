import type { Logger } from 'pino'
import type { Pool } from 'pg'
import type { PostHog } from 'posthog-node'
import type { RepositoryServices } from './repository-services'
import type { AttestationServices } from '../../services/attestation/attestation-services'
import type { FlowServices } from '../../services/flows/flows-services'
import type { ProtocolsServices } from '../../services/csm-protocols/csm-protocols-services'
import type { AuthServices } from '../../services/auth/auth-services'
import type { AnalyticsServices } from '../../services/analytics/analytics-services'
import type { DashboardServices } from '../../services/dashboard/dashboard-services'
import type { LicenciamentoServices } from '../../services/licenciamento/licenciamento-services'
import type { DebRestrServices } from '../../services/deb-restr/deb-restr-services'
import type { PecasServices } from '../../services/pecas/pecas-services'
import type { VistoriasServices } from '../../services/vistorias/vistorias-services'
import type { Clients, DetranSpServiceNowLicenciamentoClient, DetranSpServiceNowVistoriasClient } from '../../clients'
import type { DetranSpServiceNowAttestationClient } from '../../clients/detran-sp-service-now-attestation'
import type { DetranSpServiceNowDebRestrClient } from '../../clients/detran-sp-service-now-deb-restr'
import type { DetranSpServiceNowPgtoClient } from '../../clients/detran-sp-service-now-pgto'
import type { RotaCaixaPostalClient } from '../../clients/rota-caixa-postal'
import type { RotaVidaClient } from '../../clients/rota-vida'
import type { RotaCrvPecasClient } from '../../clients/rota-crv-pecas'
import type { RotaVistoriasClient } from '../../clients/rota-vistorias'
import type { TdvServices } from '../../services/tdv/tdv-services'
import type { Config } from '../../types'

export type ContainerServices = RepositoryServices & FlowServices & ProtocolsServices & AuthServices & AnalyticsServices & AttestationServices & DashboardServices & LicenciamentoServices & DebRestrServices & TdvServices & PecasServices & VistoriasServices & Clients & {
  config: Config
  pool: Pool
  logger: Logger
  posthog: PostHog
  detranSpServiceNowLicenciamentoClient: DetranSpServiceNowLicenciamentoClient
  detranSpServiceNowVistoriasClient: DetranSpServiceNowVistoriasClient
  detranSpServiceNowDebRestrClient: DetranSpServiceNowDebRestrClient
  detranSpServiceNowPgtoClient: DetranSpServiceNowPgtoClient
  detranSpServiceNowAttestationClient: DetranSpServiceNowAttestationClient
  rotaCaixaPostalClient: RotaCaixaPostalClient
  rotaVidaClient: RotaVidaClient
  rotaCrvPecasClient: RotaCrvPecasClient
  rotaVistoriasClient: RotaVistoriasClient
}
