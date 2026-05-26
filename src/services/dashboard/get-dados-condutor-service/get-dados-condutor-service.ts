export type GetDadosCondutorInput = {
  payload: string
}

export type GetDadosCondutorResult = {
  data: {
    nome: string
    cpf: string
    numeroCnh: string
    categoria: string
    validade: string
    situacao: string
    municipio: string
    uf: string
    totalPontos: number
  }
}

export class GetDadosCondutorService {
  async run (_input: GetDadosCondutorInput): Promise<GetDadosCondutorResult> {
    return {
      data: {
        nome: 'JOÃO DA SILVA',
        cpf: '123.456.789-00',
        numeroCnh: '00123456789',
        categoria: 'B',
        validade: '15/08/2028',
        situacao: 'ATIVA',
        municipio: 'SÃO PAULO',
        uf: 'SP',
        totalPontos: 10,
      },
    }
  }
}
