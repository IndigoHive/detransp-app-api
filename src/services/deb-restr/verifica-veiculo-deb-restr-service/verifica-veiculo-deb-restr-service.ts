import type { DetranSpServiceNowDebRestrClient } from '../../../clients/detran-sp-service-now-deb-restr'
import type { DebRestrVeiculoAuth, VerificaVeiculoDebRestrResult } from '../types'

export class VerificaVeiculoDebRestrService {
  private readonly client: DetranSpServiceNowDebRestrClient

  constructor (client: DetranSpServiceNowDebRestrClient) {
    this.client = client
  }

  async run (auth: DebRestrVeiculoAuth): Promise<VerificaVeiculoDebRestrResult> {
    const result = await this.client.buscaVeiculo(auth, auth.renavam)
    const attributes = result?.data?.attributes
    const meta = result?.data?.meta

    return {
      vehicleAttributes: {
        chassi: attributes?.chassi,
        yearFab: attributes?.anoFabricacao?.toString(),
        yearMod: attributes?.anoModelo?.toString(),
        cor: attributes?.cor?.descricao,
        combustivel: attributes?.combustivel?.descricao,
        tipo: attributes?.tipo?.descricao,
      },
      restrictions: {
        bloqueioFurtoRoubo: meta?.bloqueioFurtoRoubo,
        restricaoTributaria: meta?.restricaoTributaria,
        restricaoAdministrativa: meta?.restricaoAdministrativa,
        restricaoJudicial: meta?.restricaoJudicial,
        restricaoVeiculoGuinchado: meta?.restricaoVeiculoGuinchado,
        nomeAgente: meta?.nomeAgente,
      },
    }
  }
}
