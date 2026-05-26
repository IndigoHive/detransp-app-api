export type MeusVeiculosVeiculo = {
  placa: string
  renavam: string
  modelo: string
  marca: string
  anoFabricacao: string
  anoModelo: string
  cor: string
  tipo: string
  situacao: string
}

export type GetMeusVeiculosResult = {
  veiculos: MeusVeiculosVeiculo[]
}

export class GetMeusVeiculosService {
  async run (): Promise<GetMeusVeiculosResult> {
    return {
      veiculos: [
        {
          placa: 'BXG3U71',
          renavam: '00001002003',
          modelo: 'GOL GTI 1.0',
          marca: 'VOLKSWAGEN',
          anoFabricacao: '2014',
          anoModelo: '2015',
          cor: 'PRATA',
          tipo: 'AUTOMOVEL',
          situacao: 'REGULAR',
        },
        {
          placa: 'RNI4Z30',
          renavam: '00003004005',
          modelo: 'UNO MILLE',
          marca: 'FIAT',
          anoFabricacao: '2008',
          anoModelo: '2009',
          cor: 'BRANCO',
          tipo: 'AUTOMOVEL',
          situacao: 'DEBITO',
        },
      ],
    }
  }
}
