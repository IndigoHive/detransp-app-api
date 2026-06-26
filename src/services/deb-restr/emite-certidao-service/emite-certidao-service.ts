import type { DetranSpServiceNowDebRestrClient } from '../../../clients/detran-sp-service-now-deb-restr'
import type { DebRestrVeiculoAuth, EmiteCertidaoResult } from '../types'

export class EmiteCertidaoService {
  private readonly client: DetranSpServiceNowDebRestrClient

  constructor (client: DetranSpServiceNowDebRestrClient) {
    this.client = client
  }

  async run (auth: DebRestrVeiculoAuth): Promise<EmiteCertidaoResult> {
    const result = await this.client.criaCertidao(auth, auth.renavam)
    const attrs = result?.data?.attributes

    return {
      emitida: Boolean(result?.data),
      dataHoraEmissao: attrs?.dataHoraEmissao ?? null,
      validade: attrs?.validade ?? null,
    }
  }
}
