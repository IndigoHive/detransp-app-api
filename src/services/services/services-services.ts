import { asClass, type NameAndRegistrationPair } from 'awilix'
import { ListServiceCasesService } from './list-service-cases-service/list-service-cases-service'
import { GetServiceCaseDetailService } from './get-service-case-detail-service/get-service-case-detail-service'
import { ValidarCursoTeoricoDaCNHDoBrasilNoDetranSpService } from './validar-curso-teorico-da-cnh-do-brasil-no-detran-sp'
import { UploadProtocolAttachmentService } from './upload-protocol-attachment-service'
import { ListProtocolMessagesService } from './list-protocol-messages-service'
import { FinalizeProtocolService } from './finalize-protocol-service'

export type ServicesServices = {
  validarCursoTeoricoDaCNHDoBrasilNoDetranSpService: ValidarCursoTeoricoDaCNHDoBrasilNoDetranSpService
  listServiceCasesService: ListServiceCasesService
  getServiceCaseDetailService: GetServiceCaseDetailService
  uploadProtocolAttachmentService: UploadProtocolAttachmentService
  listProtocolMessagesService: ListProtocolMessagesService
  finalizeProtocolService: FinalizeProtocolService
}

export function getServicesRegistrations (): Required<NameAndRegistrationPair<ServicesServices>> {
  return {
    validarCursoTeoricoDaCNHDoBrasilNoDetranSpService: asClass(ValidarCursoTeoricoDaCNHDoBrasilNoDetranSpService).scoped(),
    listServiceCasesService: asClass(ListServiceCasesService).scoped(),
    getServiceCaseDetailService: asClass(GetServiceCaseDetailService).scoped(),
    uploadProtocolAttachmentService: asClass(UploadProtocolAttachmentService).scoped(),
    listProtocolMessagesService: asClass(ListProtocolMessagesService).scoped(),
    finalizeProtocolService: asClass(FinalizeProtocolService).scoped(),
  }
}
