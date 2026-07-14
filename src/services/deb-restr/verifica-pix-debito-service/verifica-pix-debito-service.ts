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
    const estado = normalizeEstadoQRCode(attrs?.estadoQRCode)
    const dataPagamento = attrs?.dataPagamentoQRCode

    // Observed in homolog (2026-07-14): this backend never fills
    // dataPagamentoQRCode — a QR paid via the SEFAZ webhook flips
    // estadoQRCode to "2" with the date still "". The app polls every ~5s and
    // shows the first paid response it sees, so the detection time is within
    // seconds of the actual payment — synthesize it until ServiceNow provides
    // the real timestamp.
    const confirmedDate = dataPagamento
      ? formatDateTimeBr(dataPagamento)
      : estado === 2 ? formatDateTimeBr(new Date().toISOString()) : null

    return {
      estado,
      comprovante: attrs?.idPagamentoQRCode || null,
      confirmedDate,
    }
  }
}
