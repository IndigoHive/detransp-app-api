import type { DetranSpServiceNowVistoriasClient } from '../../../clients/detran-sp-service-now-vistorias'
import { formatDateTimeBr } from '../../deb-restr/utils'
import { normalizeUtcDateTime } from '../../../utils/normalize-utc-datetime'
import type { VistoriasAuth } from '../types'
import type { IAnalyticsService } from '../../analytics'

const PAID_STATUS = 'LIQUIDADO'
const INACTIVE_STATUSES = new Set(['CANCELADO', 'EXPIRADO'])

export class VerificaQRCodeVistoriaService {
  constructor (
    private readonly client: DetranSpServiceNowVistoriasClient,
    private readonly analyticsService: IAnalyticsService
  ) {}

  async run (auth: VistoriasAuth, paymentId: string): Promise<{
    estado: number | null
    comprovante: string | null
    confirmedDate: string | null
    expiresAt: string | null
  }> {
    const result = await this.client.verificaQRCode(auth, paymentId)
    const response = result?.result
    const body = response?.success ? response.data.body : undefined
    const status = body?.status.toUpperCase()
    const estado = status === PAID_STATUS
      ? 2
      : status && INACTIVE_STATUSES.has(status) ? 3 : status ? 1 : null

    // Endpoint de status polado pelo app: sem o $insert_id por paymentId, um pagamento
    // vira um evento por poll. Pagamento é terminal, uma chave por cobrança está certa.
    if (estado === 2) {
      this.analyticsService.capture(auth.cpf, 'vistorias:payment_confirm', {
        $insert_id: this.analyticsService.createInsertId(`vistorias:payment_confirm:${paymentId}`)
      })
    }

    return {
      estado,
      comprovante: body?.id ?? null,
      confirmedDate: estado === 2 ? formatDateTimeBr(new Date().toISOString()) : null,
      expiresAt: body?.dtExpiracao ? normalizeUtcDateTime(body.dtExpiracao) : null
    }
  }
}
