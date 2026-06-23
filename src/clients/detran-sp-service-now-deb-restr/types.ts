type DescricaoField = {
  descricao?: string
}

export type ConsultaVeiculoAtributos = {
  placa?: string
  chassi?: string
  renavam?: string
  marcaModelo?: DescricaoField
  tipo?: DescricaoField
  cor?: DescricaoField
  combustivel?: DescricaoField
  anoFabricacao?: number
  anoModelo?: number
}

export type ConsultaVeiculoMeta = {
  bloqueioFurtoRoubo?: string
  restricaoTributaria?: string
  restricaoAdministrativa?: string
  restricaoJudicial?: string
  restricaoVeiculoGuinchado?: string
  nomeAgente?: string | null
}

export type ConsultaVeiculoData = {
  attributes?: ConsultaVeiculoAtributos
  meta?: ConsultaVeiculoMeta
}

export type ConsultaVeiculoResult = {
  data?: ConsultaVeiculoData
}
