import { asClass, type NameAndRegistrationPair } from 'awilix'
import { GetVehiclesService } from './get-vehicles-service'
import { SolicitarVistoriaEmTransitoService } from './solicitar-vistoria-em-transito'

export type ServicesServices = {
  getVehiclesService: GetVehiclesService
  solicitarVistoriaEmTransitoService: SolicitarVistoriaEmTransitoService
}

export function getServicesRegistrations (): Required<NameAndRegistrationPair<ServicesServices>> {
  return {
    getVehiclesService: asClass(GetVehiclesService).scoped(),
    solicitarVistoriaEmTransitoService: asClass(SolicitarVistoriaEmTransitoService).scoped(),
  }
}
