export type BuscaCidadaoResultData = {
  cpf: string
  nome: string
  nomeMae: string
  dataNascimento: string
  logradouro: string
  tipoLogradouro: string
  numeroLogradouro: string
  complemento: string
  cep: string
  bairro: string
  uf: string
  telefone: string
  codMunicipio: string
}

export type BuscaCidadaoResultSuccess = {
  result: BuscaCidadaoResultData
}

export type BuscaCidadaoResult = BuscaCidadaoResultSuccess | undefined
