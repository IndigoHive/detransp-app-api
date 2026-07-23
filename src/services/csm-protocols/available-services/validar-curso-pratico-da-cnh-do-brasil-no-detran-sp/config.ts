import { SERVICE_NOW_FORM_PRODUCER_SYS_ID, type ServiceNowFormConfig } from '../../_common'

export const validarCursoPraticoDaCNHDoBrasilNoDetranSpFormConfig: ServiceNowFormConfig = {
  producerSysId: SERVICE_NOW_FORM_PRODUCER_SYS_ID,
  deployedItem: '4571fa3d873dbe90a71aedf80cbb3598',
  ioKey: 'IO:37c7f40d87d20b90fbb365790cbb3565',
  fields: [
    { key: 'municipio', variable: 'municipio', type: 'text' },
    { key: 'jaRealizeiEtapaIniciarProcessoPrimeiraHabilitacaoJuntoPortalDetranSP', variable: 'ja_realizei_a_etapa_de__iniciar_processo_de_primeira_habilitacao__junto_ao_portal_do_detran_sp', type: 'boolean' },
    { key: 'jaConcluiEtapaCursoTeoricoExpedicaoCertificado', variable: 'ja_conclui_a_etapa_de__curso_teorico__e_expedicao_do_certificado', type: 'boolean' },
    { key: 'jaRealizeiExameAptidaoFisicaMentalExameMedicoAvaliacaoPsicologica', variable: 'ja_realizei_exame_de_aptidao_fisica_e_mental__exame_medico__e_avaliacao_psicologica', type: 'boolean' },
    { key: 'Opcoes', variable: 'opcoes', type: 'text' },
  ],
}
