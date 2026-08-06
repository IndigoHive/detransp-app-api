import { DetranSpServiceNowDebRestrError } from '../../../clients/detran-sp-service-now-deb-restr'
import type { DetranSpServiceNowDebRestrClient } from '../../../clients/detran-sp-service-now-deb-restr'
import type { DebRestrAuth, ListaVeiculosDebRestrResult } from '../types'

export class ListaVeiculosDebRestrService {
  private readonly client: DetranSpServiceNowDebRestrClient

  constructor (client: DetranSpServiceNowDebRestrClient) {
    this.client = client
  }

  async run (auth: DebRestrAuth): Promise<ListaVeiculosDebRestrResult> {
    let result
    try {
      result = await this.client.listaVeiculos(auth)
    } catch (err) {
      // ServiceNow's deb-restr scope returns its own "User is not
      // authenticated" 401 for a CPF with no vehicle record there — that
      // status was propagating verbatim to the app, which treats any 401 as
      // "your session is dead" and force-logs the user out. This isn't a
      // real session failure, so degrade to an empty list instead — the
      // existing "Lista Vazia?" flow branch already handles that correctly.
      if (err instanceof DetranSpServiceNowDebRestrError && /not authenticated/i.test(err.type)) {
        return { vehicles: [] }
      }
      throw err
    }

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
