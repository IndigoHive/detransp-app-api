export type BuscaDebitosTdvResultSuccess = {
  result: {
    valorTotal: number
    debitos: Array<{
      descricao: string
      valor: number
    }>
  }
}

export type BuscaDebitosTdvResult = BuscaDebitosTdvResultSuccess | undefined
