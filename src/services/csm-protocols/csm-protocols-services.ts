import { asClass, asFunction, type NameAndRegistrationPair } from 'awilix'
import { ListServiceCasesService } from './list-service-cases-service/list-service-cases-service'
import { GetProtocolCaseDetailService } from './get-protocol-case-detail-service'
import { ListProtocolMessagesService } from './list-protocol-messages-service'
import { FinalizeProtocolService, UploadProtocolAttachmentService, GenerateServiceNowFormService } from './_common'
import {
  validarCursoTeoricoDaCNHDoBrasilNoDetranSpFormConfig,
  liberarMatriculaDaAutoescolaFormConfig,
  retirarCorrigirBloqueioBeneficioTributarioFormConfig,
  solicitarCancelamentoIntencaoVendaFormConfig,
  solicitarDesbloqueioLaudoVistoriaFormConfig,
  alterarTipoProcessoHabilitacaoConfig,
  validarCursoPraticoDaCNHDoBrasilNoDetranSpFormConfig,
  desistirCategoriaProcessoHabilitacaoConfig,
  retirarRestricaoInfracaoTransitoVeiculoConfig,
} from './available-services'
export type ProtocolsServices = {
  validarCursoTeoricoDaCNHDoBrasilNoDetranSpService: GenerateServiceNowFormService
  validarCursoPraticoDaCNHDoBrasilNoDetranSpService: GenerateServiceNowFormService
  liberarMatriculaDaAutoescolaService: GenerateServiceNowFormService
  retirarCorrigirBloqueioBeneficioTributarioService: GenerateServiceNowFormService
  solicitarCancelamentoIntencaoVendaService: GenerateServiceNowFormService
  solicitarDesbloqueioLaudoVistoriaService: GenerateServiceNowFormService
  alterarTipoProcessoHabilitacaoService: GenerateServiceNowFormService
  desistirCategoriaProcessoHabilitacaoService: GenerateServiceNowFormService
  retirarRestricaoInfracaoTransitoVeiculoService: GenerateServiceNowFormService
  listServiceCasesService: ListServiceCasesService
  getProtocolCaseDetailService: GetProtocolCaseDetailService
  uploadProtocolAttachmentService: UploadProtocolAttachmentService
  listProtocolMessagesService: ListProtocolMessagesService
  finalizeProtocolService: FinalizeProtocolService
}

export function getProtocolsRegistrations (): Required<NameAndRegistrationPair<ProtocolsServices>> {
  return {
    validarCursoTeoricoDaCNHDoBrasilNoDetranSpService: asFunction(({ serviceNowCsm, logger }) =>
      new GenerateServiceNowFormService(validarCursoTeoricoDaCNHDoBrasilNoDetranSpFormConfig, { serviceNowCsm, logger }),
    ).scoped(),
    validarCursoPraticoDaCNHDoBrasilNoDetranSpService: asFunction(({ serviceNowCsm, logger }) =>
      new GenerateServiceNowFormService(validarCursoPraticoDaCNHDoBrasilNoDetranSpFormConfig, { serviceNowCsm, logger }),
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
    alterarTipoProcessoHabilitacaoService: asFunction(({ serviceNowCsm, logger }) =>
      new GenerateServiceNowFormService(alterarTipoProcessoHabilitacaoConfig, { serviceNowCsm, logger }),
    ).scoped(),
    desistirCategoriaProcessoHabilitacaoService: asFunction(({ serviceNowCsm, logger }) =>
      new GenerateServiceNowFormService(desistirCategoriaProcessoHabilitacaoConfig, { serviceNowCsm, logger }),
    ).scoped(),
    retirarRestricaoInfracaoTransitoVeiculoService: asFunction(({ serviceNowCsm, logger }) =>
      new GenerateServiceNowFormService(retirarRestricaoInfracaoTransitoVeiculoConfig, { serviceNowCsm, logger }),
    ).scoped(),
    listServiceCasesService: asClass(ListServiceCasesService).scoped(),
    getProtocolCaseDetailService: asClass(GetProtocolCaseDetailService).scoped(),
    uploadProtocolAttachmentService: asClass(UploadProtocolAttachmentService).scoped(),
    listProtocolMessagesService: asClass(ListProtocolMessagesService).scoped(),
    finalizeProtocolService: asClass(FinalizeProtocolService).scoped(),
  }
}
