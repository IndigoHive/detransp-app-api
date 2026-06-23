export type ListaVeiculosProprietarioResultData = {
  placa: string
  placaMercosul: 'true' | 'false'
  nomeProprietario: string
  chassi: string
  codigoRenavam: string
  codigoMunicipio: string
  nomeMunicipio: string
  codigoMarca: string
  descricaoMarca: string
  anoFabricacao: string
  anoModelo: string
  anoExercicio: string
  dataEmissao: string
  uf: string
}

export type ListaVeiculosProprietarioResultSuccess = {
  result: ListaVeiculosProprietarioResultData[]
}

export type ListaVeiculosProprietarioResult = ListaVeiculosProprietarioResultSuccess | undefined
