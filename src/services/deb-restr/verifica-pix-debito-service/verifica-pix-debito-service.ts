import type { DetranSpServiceNowPgtoClient } from '../../../clients/detran-sp-service-now-pgto'
import { normalizeEstadoQRCode } from '../../../clients/detran-sp-service-now-pgto'
import type { DebRestrVeiculoAuth, VerificaPixDebitoResult } from '../types'
import { formatDateTimeBr } from '../utils'

export type VerificaPixDebitoParams = DebRestrVeiculoAuth & {
  idSolServico: string
}

export class VerificaPixDebitoService {
  private readonly client: DetranSpServiceNowPgtoClient

  constructor (client: DetranSpServiceNowPgtoClient) {
    this.client = client
  }

  async run (params: VerificaPixDebitoParams): Promise<VerificaPixDebitoResult> {
    const { idSolServico, ...auth } = params
    const result = await this.client.verificaPix(auth, idSolServico)

    const qrCode = result?.included?.find((item) => item.type === 'qr-code')
    const attrs = qrCode?.attributes
    const dataPagamento = attrs?.dataPagamentoQRCode

    return {
      estado: normalizeEstadoQRCode(attrs?.estadoQRCode),
      comprovante: attrs?.idPagamentoQRCode || null,
      confirmedDate: dataPagamento ? formatDateTimeBr(dataPagamento) : null,
    }
  }
}
