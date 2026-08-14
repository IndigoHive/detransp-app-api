import { Unauthorized } from 'http-errors'
import { DetranSpServiceNowDebRestrError } from '../../../clients/detran-sp-service-now-deb-restr'
import type { DetranSpServiceNowDebRestrClient } from '../../../clients/detran-sp-service-now-deb-restr'
import type { DebRestrVeiculoAuth, VerificaQRCodeCertidaoResult } from '../types'
import { formatDateTimeBr } from '../utils'

export class VerificaQRCodeCertidaoService {
  private readonly client: DetranSpServiceNowDebRestrClient

  constructor (client: DetranSpServiceNowDebRestrClient) {
    this.client = client
  }

  async run (auth: DebRestrVeiculoAuth): Promise<VerificaQRCodeCertidaoResult> {
    const result = await this.verificaQRCodeCertidao(auth)
    const data = result?.data
    const estadoId = data?.relationships?.estado?.links?.data?.id
    const rawEstado = estadoId != null ? Number(estadoId) : null

    // ServiceNow sends "" (not absent) for unpaid QRs — coalesce to null so
    // both PIX polls (debt and certidão) expose the same unpaid shape
    const dataPagamento = data?.attributes?.dataPagamento

    // Observed in homolog (2026-07-14): a paid certidão QR comes back with
    // estado id 3 even though dataPagamento/endToEndId are filled — either the
    // EstadoQRCodeCertidao enum doesn't match the estados-qr-code table or
    // estado ignores payment. dataPagamento is the reliable paid signal, and
    // the app only advances past the PIX screen on estado 2 (pago).
    const estado = dataPagamento
      ? 2
      : rawEstado != null && Number.isFinite(rawEstado) ? rawEstado : null

    return {
      estado,
      comprovante: data?.attributes?.endToEndId || null,
      confirmedDate: dataPagamento ? formatDateTimeBr(dataPagamento) : null,
    }
  }

  private async verificaQRCodeCertidao (
    auth: DebRestrVeiculoAuth
  ): ReturnType<DetranSpServiceNowDebRestrClient['verificaQRCodeCertidao']> {
    try {
      return await this.client.verificaQRCodeCertidao(auth, auth.renavam)
    } catch (err) {
      if (err instanceof DetranSpServiceNowDebRestrError && err.upstreamStatus === 401) {
        throw Unauthorized('Sessão expirada. Faça login novamente.')
      }
      throw err
    }
  }
}
