import { asClass, asFunction, NameAndRegistrationPair } from 'awilix'
import { GetVehiclesService } from './get-vehicles-service'
import { SolicitarVistoriaEmTransitoService } from './solicitar-vistoria-em-transito'

export type ServicesServices = {
  getVehiclesService: GetVehiclesService
  solicitarVistoriaEmTransitoService: SolicitarVistoriaEmTransitoService
}

export function getServicesRegistrations (): Required<NameAndRegistrationPair<ServicesServices>> {
  return {
    getVehiclesService: asClass(GetVehiclesService).scoped(),
    solicitarVistoriaEmTransitoService: asFunction(({ serviceNowCsmClient }) => new SolicitarVistoriaEmTransitoService(serviceNowCsmClient)).scoped(),
  }
}
