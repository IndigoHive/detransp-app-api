import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

export type ConsultaComprasResult = {
  vehicles: Array<{
    id: string
    title: string
    plate: string
    status: string
    licensingExpirationDate: string
    type: string
    brandModel: string
    renavam: string
    lastLicensing: string
    yearFab: string
    yearMod: string
    codigoTransferencia: string
  }>
}

export class ConsultaComprasService {
  private readonly client: DetranSpServiceNowTdvClient

  constructor ({ detranSpServiceNowTdv }: Dependencies) {
    this.client = detranSpServiceNowTdv
  }

  async run (accessToken: string, cpf: string): Promise<ConsultaComprasResult> {
    const result = await this.client.listaTdvs(accessToken, {
      ativa: 'true',
      codigoComprador: cpf
    })

    if (!result?.result) {
      return { vehicles: [] }
    }

    const vehicles = result.result.map((tdv, index) => ({
      id: String(index + 1),
      title: tdv.descricaoMarcaVeiculo ?? '',
      plate: tdv.placaVeiculo ?? '',
      status: 'PENDENTE',
      licensingExpirationDate: '',
      type: 'Passeio',
      brandModel: tdv.descricaoMarcaVeiculo ?? '',
      renavam: tdv.codigoRenavamVeiculo ?? '',
      lastLicensing: '',
      yearFab: '',
      yearMod: '',
      codigoTransferencia: tdv.codigoTransferenciaVeiculo ?? ''
    }))

    return { vehicles }
  }
}
