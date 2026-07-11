import type { DetranSpServiceNowDebRestrClient } from '../../../clients/detran-sp-service-now-deb-restr'
import type { DebRestrVeiculoAuth, VerificaQRCodeCertidaoResult } from '../types'
import { formatDateTimeBr } from '../utils'

export class VerificaQRCodeCertidaoService {
  private readonly client: DetranSpServiceNowDebRestrClient

  constructor (client: DetranSpServiceNowDebRestrClient) {
    this.client = client
  }

  async run (auth: DebRestrVeiculoAuth): Promise<VerificaQRCodeCertidaoResult> {
    const result = await this.client.verificaQRCodeCertidao(auth, auth.renavam)
    const data = result?.data
    const estadoId = data?.relationships?.estado?.links?.data?.id
    const estado = estadoId != null ? Number(estadoId) : null

    // ServiceNow sends "" (not absent) for unpaid QRs — coalesce to null so
    // both PIX polls (debt and certidão) expose the same unpaid shape
    const dataPagamento = data?.attributes?.dataPagamento

    return {
      estado: estado != null && Number.isFinite(estado) ? estado : null,
      comprovante: data?.attributes?.endToEndId || null,
      confirmedDate: dataPagamento ? formatDateTimeBr(dataPagamento) : null,
    }
  }
}
