import { asClass, asFunction, type NameAndRegistrationPair } from 'awilix'
import { ListServiceCasesService } from './list-service-cases-service/list-service-cases-service'
import { GetServiceCaseDetailService } from './get-service-case-detail-service/get-service-case-detail-service'
import { UploadProtocolAttachmentService } from './upload-protocol-attachment-service'
import { ListProtocolMessagesService } from './list-protocol-messages-service'
import { FinalizeProtocolService } from './finalize-protocol-service'
import { ServiceNowFormService } from './service-now-form'
import { validarCursoTeoricoDaCNHDoBrasilNoDetranSpFormConfig } from './validar-curso-teorico-da-cnh-do-brasil-no-detran-sp'
import { liberarMatriculaDaAutoescolaFormConfig } from './liberar-matricula-da-autoescola'
import { retirarCorrigirBloqueioBeneficioTributarioFormConfig } from './retirar-corrigir-bloqueio-beneficio-tributario'
import { solicitarCancelamentoIntencaoVendaFormConfig } from './solicitar-cancelamento-intencao-venda'

export type ServicesServices = {
  validarCursoTeoricoDaCNHDoBrasilNoDetranSpService: ServiceNowFormService
  liberarMatriculaDaAutoescolaService: ServiceNowFormService
  retirarCorrigirBloqueioBeneficioTributarioService: ServiceNowFormService
  solicitarCancelamentoIntencaoVendaService: ServiceNowFormService
  listServiceCasesService: ListServiceCasesService
  getServiceCaseDetailService: GetServiceCaseDetailService
  uploadProtocolAttachmentService: UploadProtocolAttachmentService
  listProtocolMessagesService: ListProtocolMessagesService
  finalizeProtocolService: FinalizeProtocolService
}

export function getServicesRegistrations (): Required<NameAndRegistrationPair<ServicesServices>> {
  return {
    validarCursoTeoricoDaCNHDoBrasilNoDetranSpService: asFunction(({ serviceNowCsm, logger }) =>
      new ServiceNowFormService(validarCursoTeoricoDaCNHDoBrasilNoDetranSpFormConfig, { serviceNowCsm, logger }),
    ).scoped(),
    liberarMatriculaDaAutoescolaService: asFunction(({ serviceNowCsm, logger }) =>
      new ServiceNowFormService(liberarMatriculaDaAutoescolaFormConfig, { serviceNowCsm, logger }),
    ).scoped(),
    retirarCorrigirBloqueioBeneficioTributarioService: asFunction(({ serviceNowCsm, logger }) =>
      new ServiceNowFormService(retirarCorrigirBloqueioBeneficioTributarioFormConfig, { serviceNowCsm, logger }),
    ).scoped(),
    solicitarCancelamentoIntencaoVendaService: asFunction(({ serviceNowCsm, logger }) =>
      new ServiceNowFormService(solicitarCancelamentoIntencaoVendaFormConfig, { serviceNowCsm, logger }),
    ).scoped(),
    listServiceCasesService: asClass(ListServiceCasesService).scoped(),
    getServiceCaseDetailService: asClass(GetServiceCaseDetailService).scoped(),
    uploadProtocolAttachmentService: asClass(UploadProtocolAttachmentService).scoped(),
    listProtocolMessagesService: asClass(ListProtocolMessagesService).scoped(),
    finalizeProtocolService: asClass(FinalizeProtocolService).scoped(),
  }
}
