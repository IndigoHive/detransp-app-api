import type { DetranSpServiceNowDebRestrClient } from '../../../clients/detran-sp-service-now-deb-restr'
import { DetranSpServiceNowDebRestrError } from '../../../clients/detran-sp-service-now-deb-restr/errors/detran-sp-service-now-deb-restr-error'
import type { EstadoQRCodeCertidao } from '../../../clients/detran-sp-service-now-deb-restr/types'
import type { CriaQRCodeCertidaoResult, DebRestrVeiculoAuth } from '../types'

export class CriaQRCodeCertidaoService {
  private readonly client: DetranSpServiceNowDebRestrClient

  constructor (client: DetranSpServiceNowDebRestrClient) {
    this.client = client
  }

  async run (auth: DebRestrVeiculoAuth): Promise<CriaQRCodeCertidaoResult> {
    try {
      const result = await this.client.criaQRCodeCertidao(auth, auth.renavam)
      const data = result?.data
      return { qrCode: data?.attributes?.dados ?? null, expiresAt: data?.attributes?.dataExpiracao ?? null }
    } catch (createErr) {
      if (!(createErr instanceof DetranSpServiceNowDebRestrError)) throw createErr

      try {
        const existing = await this.client.verificaQRCodeCertidao(auth, auth.renavam)
        const data = existing?.data
        const estado = Number(data?.relationships?.estado?.links?.data?.id)
        if (data && estado === (1 satisfies EstadoQRCodeCertidao)) {
          return { qrCode: data.attributes?.dados ?? null, expiresAt: data.attributes?.dataExpiracao ?? null }
        }
      } catch { /* fall through to rethrow */ }

      throw createErr
    }
  }
}
