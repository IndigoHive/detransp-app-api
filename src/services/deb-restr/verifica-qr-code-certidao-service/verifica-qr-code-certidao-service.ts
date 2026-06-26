import type { DetranSpServiceNowDebRestrClient } from '../../../clients/detran-sp-service-now-deb-restr'
import type { DebRestrVeiculoAuth, VerificaQRCodeCertidaoResult } from '../types'

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

    return {
      estado: estado != null && Number.isFinite(estado) ? estado : null,
      confirmedDate: data?.attributes?.dataPagamento ?? null,
    }
  }
}
