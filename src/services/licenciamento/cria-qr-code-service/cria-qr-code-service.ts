import type { Logger } from 'pino'
import type { DetranSpServiceNowLicenciamentoClient } from '../../../clients/detran-sp-service-now-licenciamento'
import { DetranSpServiceNowLicenciamentoError } from '../../../clients/detran-sp-service-now-licenciamento/errors/detran-sp-service-now-licenciamento-error'
import type { LicenciamentoVeiculoAuth } from '../types'


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

export class CriaQRCodeLicenciamentoService {
  private readonly client: DetranSpServiceNowLicenciamentoClient
  private readonly logger: Logger

  constructor(client: DetranSpServiceNowLicenciamentoClient, logger: Logger) {
    this.client = client
    this.logger = logger
  }

  async run(auth: LicenciamentoVeiculoAuth): Promise<{ qrCode: string | null; expiresAt: string | null }> {
    try {
      const result = await this.client.criaQRCode(auth, auth.renavam)
      const data = result?.result
      // Temporary (do not ship): raw payload exposes the txid for mock-paying
      // via the SEFAZ homolog webhook (field name unverified on this client)
      // — warn level on purpose, just to stand out in the log list
      this.logger.warn(
        { action: 'mock-pay-txid', renavam: auth.renavam, valor: emvAmount(data?.qrCode), qrRawResponse: result },
        'QR licenciamento criado — resposta ServiceNow completa'
      )
      return { qrCode: data?.qrCode ?? null, expiresAt: data?.dataExpiracaoQRCode ?? null }
    } catch (createErr) {
      if (!(createErr instanceof DetranSpServiceNowLicenciamentoError)) throw createErr

      try {
        const existing = await this.client.verificaQRCode(auth, auth.renavam)
        const existingData = existing?.result
        if (existingData && existingData.estadoQRCode === 1) {
          return { qrCode: existingData.qrCode ?? null, expiresAt: existingData.dataExpiracaoQRCode ?? null }
        }
      } catch { /* fall through to rethrow */ }

      throw createErr
    }
  }
}
