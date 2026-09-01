import type { DetranSpServiceNowLicenciamentoClient } from '../../../clients/detran-sp-service-now-licenciamento'
import type { LicenciamentoVeiculoAuth } from '../types'
import type { IAnalyticsService } from '../../analytics'

export class BuscaCrlveLicenciamentoService {
  private readonly client: DetranSpServiceNowLicenciamentoClient
  private readonly analyticsService: IAnalyticsService

  constructor(client: DetranSpServiceNowLicenciamentoClient, analyticsService: IAnalyticsService) {
    this.client = client
    this.analyticsService = analyticsService
  }

  async run(auth: LicenciamentoVeiculoAuth): Promise<{ base64: string | null }> {
    const result = await this.client.buscaCrlve(auth, auth.renavam)
    const base64 = result?.result?.base64 ?? null

    // Aqui a API só devolve o base64 — quem renderiza é o app — então "send" significa
    // "entregue ao client". Dedupe por renavam: reabrir o PDF não conta como nova entrega.
    this.analyticsService.capture(
      auth.userCpf,
      base64 ? 'licenciamento:crlve_send' : 'licenciamento:crlve_failure',
      { $insert_id: this.analyticsService.createInsertId(`licenciamento:crlve:${auth.renavam}`) }
    )

    return { base64 }
  }
}
