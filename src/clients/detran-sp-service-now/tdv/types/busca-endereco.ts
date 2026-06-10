export type BuscaEnderecoResultData = {
  cep: string
  bairro: string
  tipoLogradouro: string
  endereco: string
  complemento: string | null
  localidade: string
  estado: string
  uf: string
  numeroIBGE: number
  logradouro: string | null
  municipio: string
  codigoMunicipio: number
}

export type BuscaEnderecoResultSuccess = {
  result: BuscaEnderecoResultData
}

export type BuscaEnderecoResult = BuscaEnderecoResultSuccess | undefined
