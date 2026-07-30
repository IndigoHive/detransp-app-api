import type { DetranSpServiceNowVistoriasClient } from '../../../clients/detran-sp-service-now-vistorias'
import type { GeraAutorizacaoVistoriaInput } from '../types'

export class GeraAutorizacaoVistoriaService {
  constructor (private readonly client: DetranSpServiceNowVistoriasClient) {}

  async run (input: GeraAutorizacaoVistoriaInput): Promise<{ pdf: string | null }> {
    const result = await this.client.geraDocumento(input)

    return { pdf: result?.result?.success ? result.result.base64 : null }
  }
}
