export type GetTotalPontosCNHResult = {
  data: {
    totalPontos: number
    limiteMaximo: number
    situacao: string
  }
}

export class GetTotalPontosCNHService {
  async run (): Promise<GetTotalPontosCNHResult> {
    return {
      data: {
        totalPontos: 10,
        limiteMaximo: 40,
        situacao: 'REGULAR',
      },
    }
  }
}
