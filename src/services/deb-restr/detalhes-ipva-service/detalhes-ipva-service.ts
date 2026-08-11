import type { DetranSpServiceNowDebRestrClient } from '../../../clients/detran-sp-service-now-deb-restr'
import type { DebRestrVeiculoAuth, DetalhesIpvaChip, DetalhesIpvaResult } from '../types'
import { NAO_CONSTA, debtVencimento, formatCurrencyBr, formatDateBr, isIpvaVencido, sumValores } from '../utils'

export type DetalhesIpvaParams = DebRestrVeiculoAuth & {
  pixUrl: string
}

export class DetalhesIpvaService {
  private readonly client: DetranSpServiceNowDebRestrClient

  constructor (client: DetranSpServiceNowDebRestrClient) {
    this.client = client
  }

  async run (params: DetalhesIpvaParams): Promise<DetalhesIpvaResult> {
    const { pixUrl, ...auth } = params
    const result = await this.client.buscaVeiculo(auth, auth.renavam)

    const ipva = (result?.included ?? []).filter((d) => d.type === 'debitos-ipva')
    const total = sumValores(ipva)

    return {
      items: ipva.map((d) => {
        const vencimento = debtVencimento(d)
        const statusChip: DetalhesIpvaChip = isIpvaVencido(d)
          ? { id: '1', label: 'VENCIDO', color: 'danger' }
          : { id: '1', label: 'A VENCER', color: 'warning' }

        return {
          id: d.id,
          exercicio: d.attributes.exercicio ?? null,
          valor: d.attributes.valor,
          valorLabel: formatCurrencyBr(d.attributes.valor),
          vencimento: vencimento ? formatDateBr(vencimento) : NAO_CONSTA,
          chips: [
            statusChip,
            { id: '2', label: 'PARCELA ÚNICA', color: 'info' },
          ],
          parcels: null,
        }
      }),
      total,
      totalLabel: formatCurrencyBr(total),
      pixUrl,
    }
  }
}
