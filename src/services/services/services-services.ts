import { asClass, asFunction, type NameAndRegistrationPair } from 'awilix'
import { ListServiceCasesService } from './list-service-cases-service/list-service-cases-service'
import { GetServiceCaseDetailService } from './get-service-case-detail-service/get-service-case-detail-service'
import { UploadProtocolAttachmentService } from './upload-protocol-attachment-service'
import { ListProtocolMessagesService } from './list-protocol-messages-service'
import { FinalizeProtocolService } from './finalize-protocol-service'
import { GenerateServiceNowFormService } from './service-now-form'
import { validarCursoTeoricoDaCNHDoBrasilNoDetranSpFormConfig } from './validar-curso-teorico-da-cnh-do-brasil-no-detran-sp'
import { liberarMatriculaDaAutoescolaFormConfig } from './liberar-matricula-da-autoescola'
import { retirarCorrigirBloqueioBeneficioTributarioFormConfig } from './retirar-corrigir-bloqueio-beneficio-tributario'
import { solicitarCancelamentoIntencaoVendaFormConfig } from './solicitar-cancelamento-intencao-venda'
import { solicitarDesbloqueioLaudoVistoriaFormConfig } from './solicitar-desbloqueio-laudo-vistoria'
import { alterarEnderecoVeiculoMesmoMunicipioConfig } from './alterar-endereco-veiculo-mesmo-municipio'
import { alterarTipoProcessoHabilitacaoConfig } from './alterar-tipo-processo-habilitacao'

export type ServicesServices = {
  validarCursoTeoricoDaCNHDoBrasilNoDetranSpService: GenerateServiceNowFormService
  liberarMatriculaDaAutoescolaService: GenerateServiceNowFormService
  retirarCorrigirBloqueioBeneficioTributarioService: GenerateServiceNowFormService
  solicitarCancelamentoIntencaoVendaService: GenerateServiceNowFormService
  solicitarDesbloqueioLaudoVistoriaService: GenerateServiceNowFormService
  alterarEnderecoVeiculoMesmoMunicipioService: GenerateServiceNowFormService
  alterarTipoProcessoHabilitacaoService: GenerateServiceNowFormService
  listServiceCasesService: ListServiceCasesService
  getServiceCaseDetailService: GetServiceCaseDetailService
  uploadProtocolAttachmentService: UploadProtocolAttachmentService
  listProtocolMessagesService: ListProtocolMessagesService
  finalizeProtocolService: FinalizeProtocolService
}

export function getServicesRegistrations (): Required<NameAndRegistrationPair<ServicesServices>> {
  return {
    validarCursoTeoricoDaCNHDoBrasilNoDetranSpService: asFunction(({ serviceNowCsm, logger }) =>
      new GenerateServiceNowFormService(validarCursoTeoricoDaCNHDoBrasilNoDetranSpFormConfig, { serviceNowCsm, logger }),
    ).scoped(),
    liberarMatriculaDaAutoescolaService: asFunction(({ serviceNowCsm, logger }) =>
      new GenerateServiceNowFormService(liberarMatriculaDaAutoescolaFormConfig, { serviceNowCsm, logger }),
    ).scoped(),
    retirarCorrigirBloqueioBeneficioTributarioService: asFunction(({ serviceNowCsm, logger }) =>
      new GenerateServiceNowFormService(retirarCorrigirBloqueioBeneficioTributarioFormConfig, { serviceNowCsm, logger }),
    ).scoped(),
    solicitarCancelamentoIntencaoVendaService: asFunction(({ serviceNowCsm, logger }) =>
      new GenerateServiceNowFormService(solicitarCancelamentoIntencaoVendaFormConfig, { serviceNowCsm, logger }),
    ).scoped(),
    solicitarDesbloqueioLaudoVistoriaService: asFunction(({ serviceNowCsm, logger }) =>
      new GenerateServiceNowFormService(solicitarDesbloqueioLaudoVistoriaFormConfig, { serviceNowCsm, logger }),
    ).scoped(),
    alterarEnderecoVeiculoMesmoMunicipioService: asFunction(({ serviceNowCsm, logger }) =>
      new GenerateServiceNowFormService(alterarEnderecoVeiculoMesmoMunicipioConfig, { serviceNowCsm, logger }),
    ).scoped(),
    alterarTipoProcessoHabilitacaoService: asFunction(({ serviceNowCsm, logger }) =>
      new GenerateServiceNowFormService(alterarTipoProcessoHabilitacaoConfig, { serviceNowCsm, logger }),
    ).scoped(),
    listServiceCasesService: asClass(ListServiceCasesService).scoped(),
    getServiceCaseDetailService: asClass(GetServiceCaseDetailService).scoped(),
    uploadProtocolAttachmentService: asClass(UploadProtocolAttachmentService).scoped(),
    listProtocolMessagesService: asClass(ListProtocolMessagesService).scoped(),
    finalizeProtocolService: asClass(FinalizeProtocolService).scoped(),
  }
}
