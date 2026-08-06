import type { Logger } from 'pino'
import type { DetranSpServiceNowDebRestrClient } from '../../../clients/detran-sp-service-now-deb-restr'
import type { DebRestrAuth, ListaVeiculosDebRestrResult } from '../types'

export class ListaVeiculosDebRestrService {
  private readonly client: DetranSpServiceNowDebRestrClient
  private readonly logger: Logger

  constructor (client: DetranSpServiceNowDebRestrClient, logger: Logger) {
    this.client = client
    this.logger = logger
  }

  async run (auth: DebRestrAuth): Promise<ListaVeiculosDebRestrResult> {
    // Temporary (do not ship): a known no-vehicle user reports getting logged
    // out right after "Tipo de veículo" instead of seeing the vehicles list —
    // logging the raw result/error here to see what's actually happening.
    let result
    try {
      result = await this.client.listaVeiculos(auth)
    } catch (err) {
      this.logger.info(
        {
          action: 'lista-veiculos-erro',
          errorName: (err as { name?: string })?.name,
          errorType: (err as { type?: string })?.type,
          errorMessage: (err as { message?: string })?.message,
          errorStatus: (err as { status?: number })?.status,
        },
        'Lista Veículos — erro ao buscar veículos'
      )
      throw err
    }

    // meta.qtde is always 0 in ServiceNow (known bug) — rely on data[] only
    const vehicles = (result?.data ?? []).map((veiculo) => {
      const marcaModelo = veiculo.attributes.marcaModelo?.descricao ?? ''
      return {
        id: veiculo.attributes.renavam,
        renavam: veiculo.attributes.renavam,
        plate: veiculo.attributes.placa,
        title: marcaModelo,
        brandModel: marcaModelo,
      }
    })

    this.logger.info(
      { action: 'lista-veiculos-resultado', count: vehicles.length, rawDataPresent: Boolean(result?.data) },
      'Lista Veículos — resultado'
    )

    return { vehicles }
  }
}
