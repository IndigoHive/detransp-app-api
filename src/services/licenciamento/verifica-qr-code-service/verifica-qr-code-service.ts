import type { DetranSpServiceNowLicenciamentoClient } from '../../../clients/detran-sp-service-now-licenciamento'
import type { LicenciamentoVeiculoAuth } from '../types'
import { formatDateTimeBr } from '../utils'

export class VerificaQRCodeLicenciamentoService {
  private readonly client: DetranSpServiceNowLicenciamentoClient

  constructor(client: DetranSpServiceNowLicenciamentoClient) {
    this.client = client
  }

  async run(auth: LicenciamentoVeiculoAuth): Promise<{ estado: number | null; comprovante: string | null; confirmedDate: string | null }> {
    const result = await this.client.verificaQRCode(auth, auth.renavam)
    const data = result?.result
    return {
      estado: data?.estadoQRCode ?? null,
      comprovante: data?.idPagamentoQRCode ?? null,
      confirmedDate: data?.dataPagamentoQRCode ? formatDateTimeBr(data.dataPagamentoQRCode) : null,
    }
  }
}
