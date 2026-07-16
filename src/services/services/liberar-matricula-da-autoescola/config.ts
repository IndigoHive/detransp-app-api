import { SERVICE_NOW_FORM_PRODUCER_SYS_ID, type ServiceNowFormConfig } from '../service-now-form'

export const liberarMatriculaDaAutoescolaFormConfig: ServiceNowFormConfig = {
  producerSysId: SERVICE_NOW_FORM_PRODUCER_SYS_ID,
  deployedItem: '9e42d06097266250bc73b067f053af5e',
  ioKey: 'IO:21e5c7cefb0ac310a6adf2d27eefdcba',
  extraStaticVariables: {
    declaracoes: 'true',
  },
  fields: [
    { key: 'municipio', variable: 'endereco_cidade', type: 'text' },
    { key: 'estado', variable: 'estado', type: 'text' },
    { key: 'declaracao_responsabilidade_pela_solicitacao', variable: 'declaracao_responsabilidade_pela_solicitacao', type: 'boolean' },
    { key: 'declaracao_responsabilidade_art_299', variable: 'declaracao_responsabilidade_art_299', type: 'boolean' },
    { key: 'reciclagem', variable: 'reciclagem', type: 'boolean' },
  ],
}
