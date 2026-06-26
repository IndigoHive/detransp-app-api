import type { DetranSpServiceNowDebRestrClient } from '../../../clients/detran-sp-service-now-deb-restr'
import type { BuscaDocumentoCertidaoResult, DebRestrVeiculoAuth } from '../types'

export class BuscaDocumentoCertidaoService {
  private readonly client: DetranSpServiceNowDebRestrClient

  constructor (client: DetranSpServiceNowDebRestrClient) {
    this.client = client
  }

  async run (auth: DebRestrVeiculoAuth): Promise<BuscaDocumentoCertidaoResult> {
    const result = await this.client.buscaDocumentoCertidao(auth, auth.renavam)
    return { base64: result?.data?.attributes?.conteudo ?? null }
  }
}
