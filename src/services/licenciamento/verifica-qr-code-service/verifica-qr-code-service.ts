import type { DetranSpServiceNowLicenciamentoClient } from '../../../clients/detran-sp-service-now-licenciamento'
import type { LicenciamentoVeiculoAuth } from '../types'
import { formatDateTimeBr } from '../utils'
import type { IAnalyticsService } from '../../analytics'

export class VerificaQRCodeLicenciamentoService {
  private readonly client: DetranSpServiceNowLicenciamentoClient
  private readonly analyticsService: IAnalyticsService

  constructor(client: DetranSpServiceNowLicenciamentoClient, analyticsService: IAnalyticsService) {
    this.client = client
    this.analyticsService = analyticsService
  }

  async run(auth: LicenciamentoVeiculoAuth): Promise<{ estado: number | null; comprovante: string | null; confirmedDate: string | null }> {
    const result = await this.client.verificaQRCode(auth, auth.renavam)
    const data = result?.result

    // Endpoint de polling puro: sem transição de estado local pra guardar, o $insert_id por
    // renavam é o que impede um pagamento virar um evento por poll. Pagamento é terminal,
    // então uma chave por veículo está correta.
    if (data?.estadoQRCode === 2) {
      this.analyticsService.capture(auth.userCpf, 'licenciamento:pix_pay', {
        $insert_id: this.analyticsService.createInsertId(`licenciamento:pix_pay:${auth.renavam}`)
      })
    }

    return {
      estado: data?.estadoQRCode ?? null,
      comprovante: data?.idPagamentoQRCode ?? null,
      confirmedDate: data?.dataPagamentoQRCode ? formatDateTimeBr(data.dataPagamentoQRCode) : null,
    }
  }
}
