import type { DetranSpServiceNowDebRestrClient } from '../../../clients/detran-sp-service-now-deb-restr'
import type { BuscaDocumentoCertidaoResult, DebRestrVeiculoAuth } from '../types'

export class BuscaDocumentoCertidaoAtualService {
  private readonly client: DetranSpServiceNowDebRestrClient

  constructor (client: DetranSpServiceNowDebRestrClient) {
    this.client = client
  }

  async run (auth: DebRestrVeiculoAuth): Promise<BuscaDocumentoCertidaoResult> {
    const documento = await this.client.buscaDocumentoCertidao(auth, auth.renavam)
    return {
      base64: documento?.data?.attributes?.conteudo ?? null,
    }
  }
}
