import type { Logger } from 'pino'
import type { DetranSpServiceNowDebRestrClient } from '../../../clients/detran-sp-service-now-deb-restr'
import type { DebRestrVeiculoAuth, EmiteCertidaoResult } from '../types'
import { formatDateBr, formatDateTimeBr } from '../utils'

export class EmiteCertidaoService {
  private readonly client: DetranSpServiceNowDebRestrClient
  private readonly logger: Logger

  constructor (client: DetranSpServiceNowDebRestrClient, logger: Logger) {
    this.client = client
    this.logger = logger
  }

  async run (auth: DebRestrVeiculoAuth): Promise<EmiteCertidaoResult> {
    const result = await this.client.criaCertidao(auth, auth.renavam)
    const attrs = result?.data?.[0]?.attributes
    const emitida = Boolean(attrs)

    // Temporary (do not ship): visibility into "Dados do veículo - Consulta"
    // not rendering the file — logs both the raw criaCertidao data and the
    // document fetch outcome so we can see exactly what each call returned.
    this.logger.info(
      { action: 'certidao-emite-cria', renavam: auth.renavam, emitida, criaCertidaoData: result?.data ?? null },
      'Emitir Certidão — retorno de criaCertidao'
    )

    // The flow renders the PDF right after emitting, so fetch the document in
    // the same call instead of requiring a second round-trip
    let base64: string | null = null
    if (emitida) {
      const documento = await this.client.buscaDocumentoCertidao(auth, auth.renavam)
      base64 = documento?.data?.attributes?.conteudo ?? null
      this.logger.info(
        {
          action: 'certidao-emite-documento',
          renavam: auth.renavam,
          hasConteudo: Boolean(base64),
          conteudoLength: base64?.length ?? 0,
          documentoData: documento?.data ?? null,
        },
        'Emitir Certidão — retorno de buscaDocumentoCertidao'
      )
    }

    const resultado = {
      emitida,
      dataHoraEmissao: attrs?.dataHoraEmissao ? formatDateTimeBr(attrs.dataHoraEmissao) : null,
      validade: attrs?.validade ? formatDateBr(attrs.validade) : null,
      base64,
    }

    this.logger.info(
      { action: 'certidao-emite-resultado', renavam: auth.renavam, emitida, hasBase64: Boolean(base64), base64Length: base64?.length ?? 0 },
      'Emitir Certidão — resultado final'
    )

    return resultado
  }
}
