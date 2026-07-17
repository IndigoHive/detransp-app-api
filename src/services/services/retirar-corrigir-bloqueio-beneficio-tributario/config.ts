import { SERVICE_NOW_FORM_PRODUCER_SYS_ID, type ServiceNowFormConfig } from '../service-now-form'

export const retirarCorrigirBloqueioBeneficioTributarioFormConfig: ServiceNowFormConfig = {
  producerSysId: SERVICE_NOW_FORM_PRODUCER_SYS_ID,
  deployedItem: '4ac83e1347e6a210807076b4f26d4381',
  ioKey: 'IO:40be331e47c24fd01405ae88036d4311',
  fields: [
    { key: 'renavam', variable: 'renavam', type: 'text' },
    { key: 'n__do_crdd__ssp', variable: 'n__do_crdd__ssp', type: 'text' },
    { key: 'placa', variable: 'placa', type: 'text' },
    { key: 'documentacao_conforme_pagina_do_servico', variable: 'documentacao_conforme_pagina_do_servico', type: 'boolean' },
  ],
}
