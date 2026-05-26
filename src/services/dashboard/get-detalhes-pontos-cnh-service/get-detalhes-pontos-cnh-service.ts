export type GetDetalhesPontosCNHInput = {
  meses: string
  tipoDoc: string
}

export type GetDetalhesPontosCNHResult = {
  data: {
    attributes: {
      cpf: string
      nome: string
    }
  }
  included: Array<{
    type: string
    attributes: {
      totalDePontosAtivosUltimos12Meses: string
      dataDeVencimento: string
      quantidadeProcessosPassiveisRecurso: string
      quantidadeMultasPassiveisIndicacao: string
      numeroRegistro: string
      categoria: string
      municipio: string
    }
  }>
}

export class GetDetalhesPontosCNHService {
  async run (_input: GetDetalhesPontosCNHInput): Promise<GetDetalhesPontosCNHResult> {
    return {
      data: {
        attributes: {
          cpf: '123.456.789-00',
          nome: 'JOÃO DA SILVA',
        },
      },
      included: [
        {
          type: 'cnh',
          attributes: {
            totalDePontosAtivosUltimos12Meses: '10',
            dataDeVencimento: '15/08/2028',
            quantidadeProcessosPassiveisRecurso: '0',
            quantidadeMultasPassiveisIndicacao: '1',
            numeroRegistro: '00123456789',
            categoria: 'B',
            municipio: 'SÃO PAULO',
          },
        },
      ],
    }
  }
}
