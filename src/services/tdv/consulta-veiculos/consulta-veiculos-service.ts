import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

export type ConsultaVeiculosResult = {
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
  }>
}

export class ConsultaVeiculosService {
  private readonly client: DetranSpServiceNowTdvClient

  constructor ({ detranSpServiceNowTdv }: Dependencies) {
    this.client = detranSpServiceNowTdv
  }

  async run (accessToken: string): Promise<ConsultaVeiculosResult> {
    const result = await this.client.listaVeiculosProprietario(accessToken)

    if (!result?.result) {
      return { vehicles: [] }
    }

    const vehicles = result.result.map((v, index) => ({
      id: String(index + 1),
      title: v.descricaoMarca,
      plate: v.placa,
      status: 'REGULAR',
      licensingExpirationDate: v.anoExercicio ? `31/12/${v.anoExercicio}` : '',
      type: 'Passeio',
      brandModel: v.descricaoMarca,
      renavam: v.codigoRenavam,
      lastLicensing: v.dataEmissao ?? '',
      yearFab: v.anoFabricacao,
      yearMod: v.anoModelo
    }))

    return { vehicles }
  }
}
