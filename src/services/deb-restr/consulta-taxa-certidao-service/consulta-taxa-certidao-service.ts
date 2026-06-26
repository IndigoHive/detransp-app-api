import type { DetranSpServiceNowDebRestrClient } from '../../../clients/detran-sp-service-now-deb-restr'
import type { DebRestrVeiculoAuth, TaxaCertidaoResult } from '../types'

export class ConsultaTaxaCertidaoService {
  private readonly client: DetranSpServiceNowDebRestrClient

  constructor (client: DetranSpServiceNowDebRestrClient) {
    this.client = client
  }

  async run (auth: DebRestrVeiculoAuth): Promise<TaxaCertidaoResult> {
    const result = await this.client.buscaTaxaCertidao(auth, auth.renavam)
    const attrs = result?.data?.attributes
    return {
      valor: attrs?.valor ?? null,
      descricao: attrs?.descricao ?? null,
      vencimento: attrs?.vencimento ?? null,
    }
  }
}
