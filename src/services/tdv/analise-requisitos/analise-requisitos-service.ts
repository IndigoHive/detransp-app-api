import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { CodigoEstadoTDV } from '../../../clients/detran-sp-service-now/tdv/types'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

export type AnaliseRequisitosInput = {
  selectedVehicle: {
    plate: string
    renavam: string
    [key: string]: unknown
  }
}

export type AnaliseRequisitosResult = {
  hasRestriction: boolean
  hasActiveTDV: boolean
  codigoTransferencia?: string | undefined
}

export class AnaliseRequisitosService {
  private readonly client: DetranSpServiceNowTdvClient

  constructor ({ detranSpServiceNowTdv }: Dependencies) {
    this.client = detranSpServiceNowTdv
  }

  async run (accessToken: string, cpf: string, input: AnaliseRequisitosInput): Promise<AnaliseRequisitosResult> {
    const tdvs = await this.client.listaTdvs(accessToken, {
      ativa: 'true',
      codigoVendedor: cpf,
      placaVeiculo: input.selectedVehicle.plate
    })

    const activeTdv = tdvs?.result?.find(
      tdv => tdv.ativa === 'true' && tdv.estado !== CodigoEstadoTDV.TRANSFERENCIA_CANCELADA
    )

    if (activeTdv) {
      return {
        hasRestriction: false,
        hasActiveTDV: true,
        codigoTransferencia: activeTdv.codigoTransferenciaVeiculo
      }
    }

    return {
      hasRestriction: false,
      hasActiveTDV: false
    }
  }
}
