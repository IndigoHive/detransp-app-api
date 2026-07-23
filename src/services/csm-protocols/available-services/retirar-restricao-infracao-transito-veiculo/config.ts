import { SERVICE_NOW_FORM_PRODUCER_SYS_ID, type ServiceNowFormConfig } from '../../_common'

export const retirarRestricaoInfracaoTransitoVeiculoConfig: ServiceNowFormConfig = {
  producerSysId: SERVICE_NOW_FORM_PRODUCER_SYS_ID,
  deployedItem: 'f721fbbc97f2aa142715b067f053af91',
  ioKey: 'IO:ce6e514587de0b90fbb365790cbb3559',
  extraStaticVariables: {
    documentos: 'true',
  },
  fields: [
    { key: 'qual_placa_precisa_ser_trocada', variable: 'qual_placa_precisa_ser_trocada', type: 'text' },
    { key: 'rg', variable: 'rg', type: 'text' },
    { key: 'placa', variable: 'placa', type: 'text' },
    { key: 'renavam', variable: 'renavam', type: 'text' },
    { key: 'municipio_destino', variable: 'municipio_de_destino', type: 'text' },
    { key: 'n_do_credd_ssp', variable: 'n__do_crdd__ssp', type: 'text' },
    { key: 'ainda_nao_realizei', variable: 'dois___ainda_nao_realizei_a_vistoria_e_preciso_trocar_a_minha_placa', type: 'boolean' },
    { key: 'ja_realizei_vistoria', variable: 'um___ja_realizei_a_vistoria_e_foi_aprovada_aprovada_com_apontamento', type: 'boolean' },
    { key: 'documentacao_conforme_pag_de_serv', variable: 'documentacao_conforme_pagina_do_servico', type: 'boolean' },
  ],
}
