import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { CodigoEstadoTDV } from '../../../clients/detran-sp-service-now/tdv/types'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

export type AnaliseRequisitosInput = {
  renavam: string
  plate: string
}

export type AnaliseRequisitosResult = {
  possuiRestricao: boolean
  tdvAberta: boolean
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

    // Check for existing active TDV on this plate
    const tdvs = await this.client.listaTdvs(token, {
      ativa: 'true',
      codigoVendedor: cpf,
      placaVeiculo: input.plate
    })

    const activeTdv = tdvs?.result?.find(
      tdv => tdv.ativa === 'true' && tdv.estado !== CodigoEstadoTDV.TRANSFERENCIA_CANCELADA
    )

    if (activeTdv) {
      return {
        possuiRestricao: false,
        tdvAberta: true,
        codigoTransferencia: activeTdv.codigoTransferenciaVeiculo
      }
    }

    return {
      possuiRestricao: false,
      tdvAberta: false
    }
  }
}
