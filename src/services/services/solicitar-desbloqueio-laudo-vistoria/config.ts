import { SERVICE_NOW_FORM_PRODUCER_SYS_ID, type ServiceNowFormConfig } from '../service-now-form'

export const solicitarDesbloqueioLaudoVistoriaFormConfig: ServiceNowFormConfig = {
  producerSysId: SERVICE_NOW_FORM_PRODUCER_SYS_ID,
  deployedItem: 'fc810e0087ee2610d826c9160cbb3510',
  ioKey: 'IO:621861cb4706c3101405ae88036d43c1',
  extraStaticVariables: {
    documentos: 'true',
  },
  fields: [
    { key: 'placa', variable: 'placa', type: 'text' },
    { key: 'renavam', variable: 'renavam', type: 'text' },
    { key: 'municipio_de_destino', variable: 'municipio_de_destino', type: 'text' },
    { key: 'n__do_crdd__ssp', variable: 'n__do_crdd__ssp', type: 'text' },
    { key: 'motivo_do_desbloqueio', variable: 'motivo_do_desbloqueio', type: 'text' },
    { key: 'documentacao_conforme_pagina_do_servico', variable: 'documentacao_conforme_pagina_do_servico', type: 'boolean' },
    { key: 'laudo_de_vistoria_veicular_ou_comprovante_do_erro', variable: 'laudo_de_vistoria_veicular_ou_comprovante_do_erro', type: 'boolean' },
  ],
}
