import type { DetranSpServiceNowDebRestrClient } from '../../../clients/detran-sp-service-now-deb-restr'
import type { DebRestrVeiculoAuth, EmiteCertidaoResult } from '../types'
import { formatDateBr, formatDateTimeBr } from '../utils'
import type { IAnalyticsService } from '../../analytics'

export class EmiteCertidaoService {
  private readonly client: DetranSpServiceNowDebRestrClient
  private readonly analyticsService: IAnalyticsService

  constructor (client: DetranSpServiceNowDebRestrClient, analyticsService: IAnalyticsService) {
    this.client = client
    this.analyticsService = analyticsService
  }

  async run (auth: DebRestrVeiculoAuth): Promise<EmiteCertidaoResult> {
    const result = await this.client.criaCertidao(auth, auth.renavam)
    // criaCertidao (POST, create) returns data as a single object, unlike
    // buscaCertidao (GET, list) — confirmed via live log 2026-08-06.
    const attrs = result?.data?.attributes
    const emitida = Boolean(attrs)

    let base64: string | null = null
    if (emitida) {
      const documento = await this.client.buscaDocumentoCertidao(auth, auth.renavam)
      base64 = documento?.data?.attributes?.conteudo ?? null

      // Só dentro do guard: emitida === false não é emissão. A data de emissão entra no
      // $insert_id porque o DETRAN permite reemitir — cada emissão real conta uma vez.
      this.analyticsService.capture(auth.userCpf, 'debitos:certidao_emit', {
        $insert_id: this.analyticsService.createInsertId(
          `debitos:certidao_emit:${auth.renavam}:${attrs?.dataHoraEmissao ?? ''}`
        )
      })
    }

    return {
      emitida,
      dataHoraEmissao: attrs?.dataHoraEmissao ? formatDateTimeBr(attrs.dataHoraEmissao) : null,
      validade: attrs?.validade ? formatDateBr(attrs.validade) : null,
      base64,
    }
  }
}
