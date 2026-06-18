import { asClass, type NameAndRegistrationPair } from 'awilix'
import { GetVehiclesService } from './get-vehicles-service'
import { SolicitarVistoriaEmTransitoService } from './solicitar-vistoria-em-transito'
import { ListServiceCasesService } from './list-service-cases-service/list-service-cases-service'

export type ServicesServices = {
  getVehiclesService: GetVehiclesService
  solicitarVistoriaEmTransitoService: SolicitarVistoriaEmTransitoService
  listServiceCasesService: ListServiceCasesService
}

export function getServicesRegistrations (): Required<NameAndRegistrationPair<ServicesServices>> {
  return {
    getVehiclesService: asClass(GetVehiclesService).scoped(),
    solicitarVistoriaEmTransitoService: asClass(SolicitarVistoriaEmTransitoService).scoped(),
    listServiceCasesService: asClass(ListServiceCasesService).scoped(),
  }
}
