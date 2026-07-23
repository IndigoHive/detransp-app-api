import { SERVICE_NOW_FORM_PRODUCER_SYS_ID, type ServiceNowFormConfig } from '../../_common'

export const desistirCategoriaProcessoHabilitacaoConfig: ServiceNowFormConfig = {
  producerSysId: SERVICE_NOW_FORM_PRODUCER_SYS_ID,
  deployedItem: 'e5c70cb3332a62140cb61c07ee5c7b81',
  ioKey: 'IO:796a3cc987160b90fbb365790cbb3594',
  extraStaticVariables: {
    documentos: 'true',
    declaracoes: 'true',
  },
  fields: [
    { key: 'estado', variable: 'estado', type: 'text' },
    { key: 'municipio', variable: 'endereco_cidade', type: 'text' },
    { key: 'motivo', variable: 'motivo', type: 'text' },
    { key: 'tipo_processo', variable: 'tipo_de_processo_', type: 'text' },
    { key: 'continua_processo', variable: 'continuando_o_processo_apenas_na_categoria_', type: 'text' },
    { key: 'desistir_aquisicao_categoria', variable: 'desistir_da_aquisicao_da_categoria', type: 'text' },
    { key: 'declaracao_responsabilidade_art_299', variable: 'declaracao_responsabilidade_art_299', type: 'boolean' },
  ],
}
