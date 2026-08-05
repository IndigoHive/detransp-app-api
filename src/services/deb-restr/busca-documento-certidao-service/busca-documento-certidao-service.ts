import type { DetranSpServiceNowDebRestrClient } from '../../../clients/detran-sp-service-now-deb-restr'
import type { BuscaDocumentoCertidaoResult, DebRestrVeiculoAuth } from '../types'

export type BuscaDocumentoCertidaoParams = DebRestrVeiculoAuth & {
  id: string
}

export class BuscaDocumentoCertidaoService {
  private readonly client: DetranSpServiceNowDebRestrClient

  constructor (client: DetranSpServiceNowDebRestrClient) {
    this.client = client
  }

  async run (params: BuscaDocumentoCertidaoParams): Promise<BuscaDocumentoCertidaoResult> {
    const result = await this.client.buscaDocumentoCertidaoPorId(params, params.id)
    const attrs = result?.data?.attributes
    return {
      base64: attrs?.attributes?.conteudo ?? attrs?.conteudo ?? null,
    }
  }
}
