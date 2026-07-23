import { SERVICE_NOW_FORM_PRODUCER_SYS_ID, type ServiceNowFormConfig } from '../../_common'

// TODO: deployedItem e ioKey são GUIDs do catálogo ServiceNow e precisam ser
// preenchidos pelo time que administra o catálogo antes deste serviço ir a produção.
export const retirarRestricaoInfracaoTransitoVeiculoConfig: ServiceNowFormConfig = {
  producerSysId: SERVICE_NOW_FORM_PRODUCER_SYS_ID,
  deployedItem: '',
  ioKey: '',
  extraStaticVariables: {
    documentos: 'true',
  },
  fields: [
    { key: 'qual_placa_precisa_Ser_trocada', variable: 'qual_placa_precisa_ser_trocada', type: 'text' },
    { key: 'rg', variable: 'rg', type: 'text' },
    { key: 'placa', variable: 'placa', type: 'text' },
    { key: 'renavam', variable: 'renavam', type: 'text' },
    { key: 'municipio', variable: 'endereco_cidade', type: 'text' },
    { key: 'n_do_credd_ssp', variable: 'n__do_crdd__ssp', type: 'text' },
    { key: 'opcao', variable: 'opcao', type: 'text' },
    { key: 'documentacao_conforme_pag_de_serv', variable: 'documentacao_conforme_pagina_do_servico', type: 'boolean' },
  ],
}
