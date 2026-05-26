export type GetDebitosPendentesInput = {
  cpf: string
  veicnum: string
}

export type VeiculoComDebito = {
  placa: string
  renavam: string
  modelo: string
  totalIPVA: string
  totalMultas: string
  totalLicenciamento: string
  totalDebitos: string
}

export type GetDebitosPendentesResult = {
  meta: {
    totalDeDebitosVeiculosIPVA: string
    totalDeDebitosVeiculosMultas: string
    totalDeDebitosVeiculosLicenciamento: string
    totalDeDebitosVeiculos: string
  }
  data: VeiculoComDebito[]
}

export class GetDebitosPendentesService {
  async run (_input: GetDebitosPendentesInput): Promise<GetDebitosPendentesResult> {
    return {
      meta: {
        totalDeDebitosVeiculosIPVA: 'R$ 1.250,00',
        totalDeDebitosVeiculosMultas: 'R$ 293,47',
        totalDeDebitosVeiculosLicenciamento: 'R$ 187,50',
        totalDeDebitosVeiculos: 'R$ 1.730,97',
      },
      data: [
        {
          placa: 'RNI4Z30',
          renavam: '00003004005',
          modelo: 'FIAT/UNO MILLE',
          totalIPVA: 'R$ 1.250,00',
          totalMultas: 'R$ 293,47',
          totalLicenciamento: 'R$ 187,50',
          totalDebitos: 'R$ 1.730,97',
        },
      ],
    }
  }
}
