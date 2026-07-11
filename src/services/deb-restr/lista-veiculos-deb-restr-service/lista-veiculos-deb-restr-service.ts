import type { DetranSpServiceNowDebRestrClient } from '../../../clients/detran-sp-service-now-deb-restr'
import type { DebRestrAuth, ListaVeiculosDebRestrResult } from '../types'

export class ListaVeiculosDebRestrService {
  private readonly client: DetranSpServiceNowDebRestrClient

  constructor (client: DetranSpServiceNowDebRestrClient) {
    this.client = client
  }

  async run (auth: DebRestrAuth): Promise<ListaVeiculosDebRestrResult> {
    const result = await this.client.listaVeiculos(auth)

    // meta.qtde is always 0 in ServiceNow (known bug) — rely on data[] only
    const vehicles = (result?.data ?? []).map((veiculo) => {
      const marcaModelo = veiculo.attributes.marcaModelo?.descricao ?? ''
      return {
        id: veiculo.attributes.renavam,
        renavam: veiculo.attributes.renavam,
        plate: veiculo.attributes.placa,
        title: marcaModelo,
        brandModel: marcaModelo,
      }
    })

    return { vehicles }
  }
}
