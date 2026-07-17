import { SERVICE_NOW_FORM_PRODUCER_SYS_ID, type ServiceNowFormConfig } from '../service-now-form'

export const alterarEnderecoVeiculoMesmoMunicipioConfig: ServiceNowFormConfig = {
  producerSysId: SERVICE_NOW_FORM_PRODUCER_SYS_ID,
  deployedItem: '1ce5e6534762a210807076b4f26d431b',
  ioKey: 'IO:75b306c347cec3101405ae88036d43c9',
  extraStaticVariables: {
    documentos: 'true',
  },
  fields: [
    { key: 'placa', variable: 'placa', type: 'text' },
    { key: 'endereco_bairro', variable: 'endereco_bairro', type: 'text' },
    { key: 'endereco_numero', variable: 'endereco_numero', type: 'text' },
    { key: 'n__do_crdd__ssp', variable: 'n__do_crdd__ssp', type: 'text' },
    { key: 'rua', variable: 'rua', type: 'text' },
    { key: 'endereco_cep', variable: 'endereco_cep', type: 'text' },
    { key: 'municipio_de_destino', variable: 'municipio_de_destino', type: 'text' },
  ],
}
