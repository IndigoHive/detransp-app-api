import { SERVICE_NOW_FORM_PRODUCER_SYS_ID, type ServiceNowFormConfig } from '../service-now-form'

export const solicitarCancelamentoIntencaoVendaFormConfig: ServiceNowFormConfig = {
  producerSysId: SERVICE_NOW_FORM_PRODUCER_SYS_ID,
  deployedItem: 'd1673a5b47a6a210807076b4f26d4353',
  ioKey: 'IO:286d44a2478a4fd01405ae88036d43e8',
  extraStaticVariables: {
    documentos: 'true',
  },
  fields: [
    { key: 'municipio_de_destino', variable: 'municipio_de_destino', type: 'text' },
    { key: 'renavam', variable: 'renavam', type: 'text' },
    { key: 'placa', variable: 'placa', type: 'text' },
    { key: 'n__do_crdd__ssp', variable: 'n__do_crdd__ssp', type: 'text' },
    { key: 'documento_de_identificacao_do_proprietario', variable: 'documento_de_identificacao_do_proprietario', type: 'boolean' },
    { key: 'documentacao_conforme_pagina_do_servico', variable: 'documentacao_conforme_pagina_do_servico', type: 'boolean' },
  ],
}
