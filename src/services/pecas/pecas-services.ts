import { asFunction, type NameAndRegistrationPair } from 'awilix'
import { ConsultaPecaService } from './consulta-peca-service'

export type PecasServices = {
  consultaPecaService: ConsultaPecaService
}

export function getPecasRegistrations(): Required<NameAndRegistrationPair<PecasServices>> {
  return {
    consultaPecaService: asFunction(
      ({ rotaCrvPecasClient, rotaVistoriasClient, analyticsService }) =>
        new ConsultaPecaService(rotaCrvPecasClient, rotaVistoriasClient, analyticsService)
    ).scoped(),
  }
}
