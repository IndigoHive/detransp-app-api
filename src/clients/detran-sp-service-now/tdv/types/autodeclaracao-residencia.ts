export type CriaAutodeclaracaoResidenciaCommand = {
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  municipio: string
  uf: string
  nomeUF: string
}

export type CriaAutodeclaracaoResidenciaResultSuccess = {
  result: {
    autodeclaracaoResidencia: string
  }
}

export type CriaAutodeclaracaoResidenciaResult =
  CriaAutodeclaracaoResidenciaResultSuccess | undefined
