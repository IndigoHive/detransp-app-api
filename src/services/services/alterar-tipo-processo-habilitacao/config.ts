import { SERVICE_NOW_FORM_PRODUCER_SYS_ID, type ServiceNowFormConfig } from '../service-now-form'

export const alterarTipoProcessoHabilitacaoConfig: ServiceNowFormConfig = {
  producerSysId: SERVICE_NOW_FORM_PRODUCER_SYS_ID,
  deployedItem: '34dead1387226a105c6840040cbb354f',
  ioKey: 'IO:7278c6c7470207101405ae88036d4352',
  extraStaticVariables: {
    documentos: 'true',
    declaracoes: 'true',
  },
  fields: [
    { key: 'estado', variable: 'estado', type: 'text' },
    { key: 'endereco_cidade', variable: 'endereco_cidade', type: 'text' },
    { key: 'solicito_a_alteracao_do_renach_n_', variable: 'solicito_a_alteracao_do_renach_n_', type: 'text' },
    { key: 'motivo', variable: 'motivo', type: 'text' },
    { key: 'informar_a_alteracao', variable: 'informar_a_alteracao', type: 'text' },
    { key: 'assumo_total_responsabilidade', variable: 'assumo_total_responsabilidade', type: 'text' },
    { key: 'declaracao_responsabilidade_art_299', variable: 'declaracao_responsabilidade_art_299', type: 'boolean' },
  ],
}
