import { SERVICE_NOW_FORM_PRODUCER_SYS_ID, type ServiceNowFormConfig } from '../../_common'

export const validarCursoTeoricoDaCNHDoBrasilNoDetranSpFormConfig: ServiceNowFormConfig = {
  producerSysId: SERVICE_NOW_FORM_PRODUCER_SYS_ID,
  deployedItem: '0a6d000147f53a9006482a54f26d431b',
  ioKey: 'IO:12227dc987564b90fbb365790cbb35f6',
  fields: [
    { key: 'municipio', variable: 'municipio', type: 'text' },
    { key: 'ja_relizei_etapa_iniciar', variable: 'ja_realizei_a_etapa_de__iniciar_processo_de_primeira_habilitacao__junto_ao_portal_do_detran_sp', type: 'boolean' },
    { key: 'ja_concluiu_curso_teorico', variable: 'ja_conclui_a_etapa_de_curso_teorico_e_expedicao_de_certificado', type: 'boolean' },
    { key: 'ja_realizei_exame', variable: 'ja_realizei_exame_de_aptidao_fisica_e_mental__exame_medico__e_avaliacao_psicologica', type: 'boolean' }
  ],
}



