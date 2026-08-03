import type { DetranSpServiceNowVistoriasClient } from '../../../clients/detran-sp-service-now-vistorias'
import type { VistoriasAuth } from '../types'

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
      expiresAt: qrCode?.dtExpiracao ?? null
    }
  }
}
