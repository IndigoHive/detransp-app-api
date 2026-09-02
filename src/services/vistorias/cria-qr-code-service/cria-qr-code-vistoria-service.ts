import type { DetranSpServiceNowVistoriasClient } from '../../../clients/detran-sp-service-now-vistorias'
import type { VistoriasAuth } from '../types'
import type { IAnalyticsService } from '../../analytics'

function resolveExpiresAt (expirationSeconds: number | undefined): string | null {
  if (expirationSeconds === undefined || !Number.isFinite(expirationSeconds) || expirationSeconds <= 0) return null

  return new Date(Date.now() + expirationSeconds * 1000).toISOString()
}

export class CriaQRCodeVistoriaService {
  constructor (
    private readonly client: DetranSpServiceNowVistoriasClient,
    private readonly analyticsService: IAnalyticsService
  ) {}

  async run (auth: VistoriasAuth, correlationId: string): Promise<{
    idSolServico: string | null
    qrCode: string | null
    expiresAt: string | null
  }> {
    const result = await this.client.criaQRCode(auth, { correlationID: correlationId })
    const response = result?.result
    const qrCode = response?.success ? response.data.data : undefined

    // Guard obrigatório: em falha o serviço devolve nulls sem lançar, então um capture
    // solto no return contaria falha como cobrança gerada.
    if (qrCode?.emv) {
      this.analyticsService.capture(auth.cpf, 'vistorias:qr_code_create', {
        $insert_id: this.analyticsService.createInsertId(`vistorias:qr_code_create:${qrCode.id}`)
      })
    }

    return {
      idSolServico: qrCode?.id ?? null,
      qrCode: qrCode?.emv ?? null,
      expiresAt: resolveExpiresAt(qrCode?.expiracao)
    }
  }
}
