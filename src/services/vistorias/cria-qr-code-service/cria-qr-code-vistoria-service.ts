import type { DetranSpServiceNowVistoriasClient } from '../../../clients/detran-sp-service-now-vistorias'
import type { VistoriasAuth } from '../types'

function resolveExpiresAt (expirationSeconds: number | undefined): string | null {
  if (expirationSeconds === undefined || !Number.isFinite(expirationSeconds) || expirationSeconds <= 0) return null

  return new Date(Date.now() + expirationSeconds * 1000).toISOString()
}

export class CriaQRCodeVistoriaService {
  constructor (private readonly client: DetranSpServiceNowVistoriasClient) {}

  async run (auth: VistoriasAuth, correlationId: string): Promise<{
    idSolServico: string | null
    qrCode: string | null
    expiresAt: string | null
  }> {
    const result = await this.client.criaQRCode(auth, { correlationID: correlationId })
    const response = result?.result
    const qrCode = response?.success ? response.data.data : undefined

    return {
      idSolServico: qrCode?.id ?? null,
      qrCode: qrCode?.emv ?? null,
      expiresAt: resolveExpiresAt(qrCode?.expiracao)
    }
  }
}
