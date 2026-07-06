import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { CodigoEstadoTDV } from '../../../clients/detran-sp-service-now/tdv/types'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'

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

  async run (authorizationHeader: string | undefined, input: CancelarTdvInput): Promise<CancelarTdvResult> {
    const token = extractBearerToken(authorizationHeader)
    const cpf = extractCpfFromToken(token)
    const auth = { token, cpf }

    await this.client.atualizaTdv(auth, input.codigoTransferencia, {
      estado: CodigoEstadoTDV.TRANSFERENCIA_CANCELADA,
      ativa: 'false'
    })

    return { success: true }
  }
}
