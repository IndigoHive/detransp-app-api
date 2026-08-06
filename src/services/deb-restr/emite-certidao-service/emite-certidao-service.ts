import type { DetranSpServiceNowDebRestrClient } from '../../../clients/detran-sp-service-now-deb-restr'
import type { DebRestrVeiculoAuth, EmiteCertidaoResult } from '../types'
import { formatDateBr, formatDateTimeBr } from '../utils'

export class EmiteCertidaoService {
  private readonly client: DetranSpServiceNowDebRestrClient

  constructor (client: DetranSpServiceNowDebRestrClient) {
    this.client = client
  }

  async run (auth: DebRestrVeiculoAuth): Promise<EmiteCertidaoResult> {
    const result = await this.client.criaCertidao(auth, auth.renavam)
    // criaCertidao (POST, create) returns data as a single object, unlike
    // buscaCertidao (GET, list) — confirmed via live log 2026-08-06.
    const attrs = result?.data?.attributes
    const emitida = Boolean(attrs)

    // The flow renders the PDF right after emitting, so fetch the document in
    // the same call instead of requiring a second round-trip
    let base64: string | null = null
    if (emitida) {
      const documento = await this.client.buscaDocumentoCertidao(auth, auth.renavam)
      base64 = documento?.data?.attributes?.conteudo ?? null
    }

    return {
      emitida,
      dataHoraEmissao: attrs?.dataHoraEmissao ? formatDateTimeBr(attrs.dataHoraEmissao) : null,
      validade: attrs?.validade ? formatDateBr(attrs.validade) : null,
      base64,
    }
  }
}
