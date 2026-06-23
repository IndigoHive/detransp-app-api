import type { DetranSpServiceNowLicenciamentoClient } from '../../../clients/detran-sp-service-now-licenciamento'
import { DetranSpServiceNowLicenciamentoError } from '../../../clients/detran-sp-service-now-licenciamento/errors/detran-sp-service-now-licenciamento-error'
import type { LicenciamentoVeiculoAuth } from '../types'

export class CriaQRCodeLicenciamentoService {
  private readonly client: DetranSpServiceNowLicenciamentoClient

  constructor(client: DetranSpServiceNowLicenciamentoClient) {
    this.client = client
  }

  async run(auth: LicenciamentoVeiculoAuth): Promise<{ qrCode: string | null; expiresAt: string | null }> {
    try {
      const result = await this.client.criaQRCode(auth, auth.renavam)
      const data = result?.result
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
