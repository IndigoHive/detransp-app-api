export type GetDetalhesMultaInput = {
  auto: string
  cpf: string
  idVeiculo: string
}

export type GetDetalhesMultaResult = {
  data: {
    auto: string
    data: string
    hora: string
    local: string
    descricao: string
    codigoInfracao: string
    pontos: number
    valor: string
    desconto: string
    valorComDesconto: string
    vencimento: string
    situacao: string
    placa: string
    renavam: string
    orgaoAutuador: string
    condutorIndicado: boolean
  }
}

export class GetDetalhesMultaService {
  async run (_input: GetDetalhesMultaInput): Promise<GetDetalhesMultaResult> {
    return {
      data: {
        auto: 'AU-2024-000123',
        data: '10/03/2024',
        hora: '14:32',
        local: 'AV. PAULISTA, 1000 - SÃO PAULO/SP',
        descricao: 'VELOCIDADE SUPERIOR EM 20% EM VIA DE TRANSITO RAPIDO',
        codigoInfracao: '74550',
        pontos: 5,
        valor: 'R$ 293,47',
        desconto: '20%',
        valorComDesconto: 'R$ 234,77',
        vencimento: '10/05/2024',
        situacao: 'NOTIFICADA',
        placa: 'RNI4Z30',
        renavam: '00003004005',
        orgaoAutuador: 'CET-SP',
        condutorIndicado: false,
      },
    }
  }
}
