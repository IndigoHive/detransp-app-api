import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { CodigoEstadoTDV } from '../../../clients/detran-sp-service-now/tdv/types'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'

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

  async run (authorizationHeader: string | undefined, input: AnaliseRequisitosInput): Promise<AnaliseRequisitosResult> {
    const token = extractBearerToken(authorizationHeader)
    const cpf = extractCpfFromToken(token)
    const auth = { token, cpf }

    // Check for existing active TDV on this plate
    const tdvs = await this.client.listaTdvs(auth, {
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
