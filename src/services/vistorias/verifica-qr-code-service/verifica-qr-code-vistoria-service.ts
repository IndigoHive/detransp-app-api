import type { DetranSpServiceNowVistoriasClient } from '../../../clients/detran-sp-service-now-vistorias'
import { formatDateTimeBr } from '../../deb-restr/utils'

const PAID_STATUS = 'LIQUIDADO'
const INACTIVE_STATUSES = new Set(['CANCELADO', 'EXPIRADO'])

export class VerificaQRCodeVistoriaService {
  constructor (private readonly client: DetranSpServiceNowVistoriasClient) {}

  async run (paymentId: string): Promise<{
    estado: number | null
    comprovante: string | null
    confirmedDate: string | null
  }> {
    const result = await this.client.verificaQRCode(paymentId)
    const response = result?.result
    const body = response?.success ? response.data.body : undefined
    const status = body?.status.toUpperCase()
    const estado = status === PAID_STATUS
      ? 2
      : status && INACTIVE_STATUSES.has(status) ? 3 : status ? 1 : null

    return {
      estado,
      comprovante: body?.id ?? null,
      confirmedDate: estado === 2 ? formatDateTimeBr(new Date().toISOString()) : null
    }
  }
}
