import { SERVICE_NOW_FORM_PRODUCER_SYS_ID, type ServiceNowFormConfig } from '../../_common'

export const validarCursoTeoricoDaCNHDoBrasilNoDetranSpFormConfig: ServiceNowFormConfig = {
  producerSysId: SERVICE_NOW_FORM_PRODUCER_SYS_ID,
  deployedItem: '0a6d000147f53a9006482a54f26d431b',
  ioKey: 'IO:b82641dd47f9cf501405ae88036d43d6',
  fields: [
    { key: 'municipio', variable: 'municipio', type: 'text' },
    { key: 'jaRealizeiEtapaIniciarProcessoPrimeiraHabilitacaoJuntoPortalDetranSP', variable: 'ja_realizei_a_etapa_de__iniciar_processo_de_primeira_habilitacao__junto_ao_portal_do_detran_sp', type: 'boolean' },
    { key: 'jaConcluiEtapaCursoTeoricoExpedicaoCertificado', variable: 'ja_conclui_a_etapa_de__curso_teorico__e_expedicao_do_certificado', type: 'boolean' },
    { key: 'jaRealizeiExameAptidaoFisicaMentalExameMedicoAvaliacaoPsicologica', variable: 'ja_realizei_exame_de_aptidao_fisica_e_mental__exame_medico__e_avaliacao_psicologica', type: 'boolean' },
    { key: 'documentoComprovanteRepresentacao', variable: 'doc_comprovacao_representacao', type: 'boolean' },
  ],
}
