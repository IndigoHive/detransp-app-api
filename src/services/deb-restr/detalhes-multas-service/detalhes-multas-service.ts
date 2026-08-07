import type { DetranSpServiceNowDebRestrClient } from '../../../clients/detran-sp-service-now-deb-restr'
import type { DebRestrVeiculoAuth, DetalhesMultasResult } from '../types'
import { formatCurrencyBr, formatDateBr, sumValores } from '../utils'

export type DetalhesMultasParams = DebRestrVeiculoAuth & {
  pixUrl: string
}

export class DetalhesMultasService {
  private readonly client: DetranSpServiceNowDebRestrClient

  constructor (client: DetranSpServiceNowDebRestrClient) {
    this.client = client
  }

  async run (params: DetalhesMultasParams): Promise<DetalhesMultasResult> {
    const { pixUrl, ...auth } = params
    const result = await this.client.buscaVeiculo(auth, auth.renavam)

    const multas = (result?.included ?? []).filter(
      (d) => d.type === 'debitos-milt' || d.type === 'debitos-renainf'
    )
    const total = sumValores(multas)

    return {
      infracoes: multas.map((d) => {
        const attrs = d.attributes
        const dataInfracao = attrs.dataInfracao ?? attrs.dataHora ?? null
        return {
          id: d.id,
          autoInfracao: attrs.autoInfracao ?? null,
          descricao: attrs.descricao ?? attrs.autoInfracao ?? attrs.nomeServico ?? '',
          valor: attrs.valor,
          valorLabel: formatCurrencyBr(attrs.valor),
          data: dataInfracao ? formatDateBr(dataInfracao.slice(0, 10)) : null,
          municipio: attrs.municipio ?? null,
          orgaoAutuador: attrs.orgaoAutuador?.nome ?? attrs.nomeOrgaoAutuador ?? null,
        }
      }),
      total,
      totalLabel: formatCurrencyBr(total),
      pixUrl,
    }
  }
}
