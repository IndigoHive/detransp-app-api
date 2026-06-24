import { asClass, type NameAndRegistrationPair } from 'awilix'
import { GetVehiclesService } from './get-vehicles-service'
import { SolicitarVistoriaEmTransitoService } from './solicitar-vistoria-em-transito'
import { ListServiceCasesService } from './list-service-cases-service/list-service-cases-service'
import { GetServiceCaseDetailService } from './get-service-case-detail-service/get-service-case-detail-service'

export type ServicesServices = {
  getVehiclesService: GetVehiclesService
  solicitarVistoriaEmTransitoService: SolicitarVistoriaEmTransitoService
  listServiceCasesService: ListServiceCasesService
  getServiceCaseDetailService: GetServiceCaseDetailService
}

export function getServicesRegistrations (): Required<NameAndRegistrationPair<ServicesServices>> {
  return {
    getVehiclesService: asClass(GetVehiclesService).scoped(),
    solicitarVistoriaEmTransitoService: asClass(SolicitarVistoriaEmTransitoService).scoped(),
    listServiceCasesService: asClass(ListServiceCasesService).scoped(),
    getServiceCaseDetailService: asClass(GetServiceCaseDetailService).scoped(),
  }
}
