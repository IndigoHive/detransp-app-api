import type { DetranSpServiceNowLicenciamentoClient } from '../../../clients/detran-sp-service-now-licenciamento'
import type { LicenciamentoVeiculoAuth } from '../types'

export class BuscaCrlveLicenciamentoService {
  private readonly client: DetranSpServiceNowLicenciamentoClient

  constructor(client: DetranSpServiceNowLicenciamentoClient) {
    this.client = client
  }

  async run(auth: LicenciamentoVeiculoAuth): Promise<{ base64: string | null }> {
    const result = await this.client.buscaCrlve(auth, auth.renavam)
    return { base64: result?.result?.base64 ?? null }
  }
}
