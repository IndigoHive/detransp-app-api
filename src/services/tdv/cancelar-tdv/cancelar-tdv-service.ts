import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { CodigoEstadoTDV } from '../../../clients/detran-sp-service-now/tdv/types'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

export type CancelarTdvInput = {
  codigoTransferencia: string
}

export type CancelarTdvResult = {
  success: boolean
}

export class CancelarTdvService {
  private readonly client: DetranSpServiceNowTdvClient

  constructor ({ detranSpServiceNowTdv }: Dependencies) {
    this.client = detranSpServiceNowTdv
  }

  async run (accessToken: string, input: CancelarTdvInput): Promise<CancelarTdvResult> {
    await this.client.atualizaTdv(accessToken, input.codigoTransferencia, {
      estado: CodigoEstadoTDV.TRANSFERENCIA_CANCELADA,
      ativa: 'false'
    })

    return { success: true }
  }
}
