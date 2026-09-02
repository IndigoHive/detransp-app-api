import type { Logger } from 'pino'
import type { DetranSpServiceNowDebRestrClient } from '../../../clients/detran-sp-service-now-deb-restr'
import { DetranSpServiceNowDebRestrError } from '../../../clients/detran-sp-service-now-deb-restr/errors/detran-sp-service-now-deb-restr-error'
import type { EstadoQRCodeCertidao } from '../../../clients/detran-sp-service-now-deb-restr/types'
import type { CriaQRCodeCertidaoResult, DebRestrVeiculoAuth } from '../types'
import type { IAnalyticsService } from '../../analytics'


// Temporary (do not ship): EMV TLV walk to extract tag 54 (transaction amount)
function emvAmount (emv: string | null | undefined): string | null {
  if (!emv) return null
  let i = 0
  while (i + 4 <= emv.length) {
    const len = parseInt(emv.slice(i + 2, i + 4), 10)
    if (Number.isNaN(len)) return null
    if (emv.slice(i, i + 2) === '54') return emv.slice(i + 4, i + 4 + len)
    i += 4 + len
  }
  return null
}

export class CriaQRCodeCertidaoService {
  private readonly client: DetranSpServiceNowDebRestrClient
  private readonly logger: Logger
  private readonly analyticsService: IAnalyticsService

  constructor (client: DetranSpServiceNowDebRestrClient, logger: Logger, analyticsService: IAnalyticsService) {
    this.client = client
    this.logger = logger
    this.analyticsService = analyticsService
  }

  async run (auth: DebRestrVeiculoAuth): Promise<CriaQRCodeCertidaoResult> {
    try {
      const result = await this.client.criaQRCodeCertidao(auth, auth.renavam)
      const data = result?.data
      // Temporary (do not ship): txid for mock-paying via the SEFAZ homolog
      // webhook — warn level on purpose, just to stand out in the log list
      this.logger.warn(
        { action: 'mock-pay-txid', renavam: auth.renavam, txid: data?.id, valor: emvAmount(data?.attributes?.dados) },
        'QR certidão criado — txid para pagamento mock em homolog'
      )
      this.captureQRCodeCreate(auth)

      return { qrCode: data?.attributes?.dados ?? null, expiresAt: data?.attributes?.dataExpiracao ?? null }
    } catch (createErr) {
      if (!(createErr instanceof DetranSpServiceNowDebRestrError)) throw createErr

      try {
        const existing = await this.client.verificaQRCodeCertidao(auth, auth.renavam)
        const data = existing?.data
        const estado = Number(data?.relationships?.estado?.links?.data?.id)
        if (data && estado === (1 satisfies EstadoQRCodeCertidao)) {
          this.captureQRCodeCreate(auth)

          return { qrCode: data.attributes?.dados ?? null, expiresAt: data.attributes?.dataExpiracao ?? null }
        }
      } catch { /* fall through to rethrow */ }

      throw createErr
    }
  }

  // $insert_id por renavam colapsa criação e recuperação-do-existente num evento só:
  // um retry sobre o mesmo veículo não vira duas gerações de cobrança.
  private captureQRCodeCreate (auth: DebRestrVeiculoAuth): void {
    this.analyticsService.capture(auth.userCpf, 'debitos:certidao_pix_generate', {
      $insert_id: this.analyticsService.createInsertId(`debitos:certidao_pix_generate:${auth.renavam}`)
    })
  }
}
