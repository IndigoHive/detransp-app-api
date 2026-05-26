export type GetListaMultasInput = {
  cpf: string
  ultimosmeses: boolean
}

export type Multa = {
  auto: string
  data: string
  descricao: string
  pontos: number
  valor: string
  situacao: string
  placa: string
  orgaoAutuador: string
}

export type GetListaMultasResult = {
  multas: Multa[]
}

export class GetListaMultasService {
  async run (_input: GetListaMultasInput): Promise<GetListaMultasResult> {
    return {
      multas: [
        {
          auto: 'AU-2024-000123',
          data: '10/03/2024',
          descricao: 'VELOCIDADE SUPERIOR EM 20% EM VIA DE TRANSITO RAPIDO',
          pontos: 5,
          valor: 'R$ 293,47',
          situacao: 'NOTIFICADA',
          placa: 'RNI4Z30',
          orgaoAutuador: 'CET-SP',
        },
      ],
    }
  }
}
