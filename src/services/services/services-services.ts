import { asClass, type NameAndRegistrationPair } from 'awilix'
import { GetVehiclesService } from './get-vehicles-service'
import { SolicitarVistoriaEmTransitoMockService } from './solicitar-vistoria-em-transito'
import { ListServiceCasesService } from './list-service-cases-service/list-service-cases-service'
import { GetServiceCaseDetailService } from './get-service-case-detail-service/get-service-case-detail-service'
import { ValidarCursoTeoricoDaCNHDoBrasilNoDetranSpService } from './validar-curso-teorico-da-cnh-do-brasil-no-detran-sp'
import { UploadProtocolAttachmentService } from './upload-protocol-attachment-service'

export type ServicesServices = {
  getVehiclesService: GetVehiclesService
  validarCursoTeoricoDaCNHDoBrasilNoDetranSpService: ValidarCursoTeoricoDaCNHDoBrasilNoDetranSpService
  listServiceCasesService: ListServiceCasesService
  getServiceCaseDetailService: GetServiceCaseDetailService
  uploadProtocolAttachmentService: UploadProtocolAttachmentService
}

export function getServicesRegistrations (): Required<NameAndRegistrationPair<ServicesServices>> {
  return {
    getVehiclesService: asClass(GetVehiclesService).scoped(),
    validarCursoTeoricoDaCNHDoBrasilNoDetranSpService: asClass(ValidarCursoTeoricoDaCNHDoBrasilNoDetranSpService).scoped(),
    listServiceCasesService: asClass(ListServiceCasesService).scoped(),
    getServiceCaseDetailService: asClass(GetServiceCaseDetailService).scoped(),
    uploadProtocolAttachmentService: asClass(UploadProtocolAttachmentService).scoped(),
  }
}
