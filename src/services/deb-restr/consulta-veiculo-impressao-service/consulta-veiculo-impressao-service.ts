import type { ConsultaVeiculoDebitosParams, ConsultaVeiculoDebitosService } from '../consulta-veiculo-debitos-service'
import type { VehicleDebtsPayload } from '../types'

export class ConsultaVeiculoImpressaoService {
  private readonly consultaVeiculoDebitosService: ConsultaVeiculoDebitosService

  constructor (consultaVeiculoDebitosService: ConsultaVeiculoDebitosService) {
    this.consultaVeiculoDebitosService = consultaVeiculoDebitosService
  }

  async run (params: ConsultaVeiculoDebitosParams): Promise<VehicleDebtsPayload | null> {
    const result = await this.consultaVeiculoDebitosService.run(params)
    return result.debts ? this.stripInteractiveFields(result.debts) : null
  }

  private stripInteractiveFields (debts: VehicleDebtsPayload): VehicleDebtsPayload {
    return {
      ipva: {
        ...(debts.ipva.status ? { status: debts.ipva.status } : {}),
        items: debts.ipva.items,
        totalLabel: debts.ipva.totalLabel,
        detailsButton: debts.ipva.detailsButton,
        pixButton: 'hidden',
      },
      multas: {
        ...(debts.multas.status ? { status: debts.multas.status } : {}),
        items: debts.multas.items,
        totalLabel: debts.multas.totalLabel,
        detailsButton: debts.multas.detailsButton,
        pixButton: 'hidden',
      },
      licenciamento: {
        status: debts.licenciamento.status,
        items: debts.licenciamento.items,
        pixButton: 'hidden',
      },
    }
  }
}
