import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { CodigoEstadoTDV } from '../../../clients/detran-sp-service-now/tdv/types'
import { extractBearerToken } from '../../../utils/token'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

export type ConfirmarCompraInput = {
  codigoTransferencia: string
  codigoProvaVidaComprador: string
}

export type ConfirmarCompraResult = {
  success: boolean
  autodeclaracaoResidencia?: string | undefined
}

export class ConfirmarCompraService {
  private readonly client: DetranSpServiceNowTdvClient

  constructor ({ detranSpServiceNowTdv }: Dependencies) {
    this.client = detranSpServiceNowTdv
  }

  async run (authorizationHeader: string | undefined, input: ConfirmarCompraInput): Promise<ConfirmarCompraResult> {
    const token = extractBearerToken(authorizationHeader)

    // Advance to state 4 (INTENCAO_COMPRA_CONFIRMADA)
    await this.client.atualizaTdv(token, input.codigoTransferencia, {
      estado: CodigoEstadoTDV.INTENCAO_COMPRA_CONFIRMADA,
      codigoProvaVidaComprador: input.codigoProvaVidaComprador,
      tipoProvaVidaComprador: '2' // LIVENESS
    })

    // Fetch the updated TDV to get autodeclaração
    const tdv = await this.client.buscaTdv(token, input.codigoTransferencia)

    return {
      success: true,
      autodeclaracaoResidencia: tdv?.result?.autodeclaracaoResidenciaComprador
    }
  }
}
