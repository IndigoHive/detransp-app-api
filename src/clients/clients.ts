import { asClass, type NameAndRegistrationPair } from 'awilix'
import { DetranSpServiceNowTdvClient, DetranSpServiceNowDashboardClient } from './detran-sp-service-now'
import { IdpSpGovBrServiceClient } from './idp-sp-gov-br-service'
import { IdpSpGovBrSSOClient } from './idp-sp-gov-br-sso'
import { ServiceNowCsmClient } from './service-now-csm'

export type Clients = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
  detranSpServiceNowDashboard: DetranSpServiceNowDashboardClient
  idpSpGovBrService: IdpSpGovBrServiceClient
  idpSpGovBrSSO: IdpSpGovBrSSOClient
  serviceNowCsm: ServiceNowCsmClient
}

export function getClientRegistrations (): Required<NameAndRegistrationPair<Clients>> {
  return {
    detranSpServiceNowTdv: asClass(DetranSpServiceNowTdvClient).scoped(),
    detranSpServiceNowDashboard: asClass(DetranSpServiceNowDashboardClient).scoped(),
    idpSpGovBrService: asClass(IdpSpGovBrServiceClient).scoped(),
    idpSpGovBrSSO: asClass(IdpSpGovBrSSOClient).scoped(),
    serviceNowCsm: asClass(ServiceNowCsmClient).scoped()
  }
}
