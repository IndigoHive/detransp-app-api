import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'
import { assertKmValida } from '../valida-km'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

export type ValidarKmInput = {
  codigoTransferencia: string
  quilometragem: string
}

export type ValidarKmResult = {
  valid: true
}

// Read-only pre-check so the seller sees an invalid mileage while still on the field,
// instead of only after submitting the sale screen. Never mutates the TDV.
export class ValidarKmService {
  private readonly client: DetranSpServiceNowTdvClient

  constructor ({ detranSpServiceNowTdv }: Dependencies) {
    this.client = detranSpServiceNowTdv
  }

  async run (authorizationHeader: string | undefined, input: ValidarKmInput): Promise<ValidarKmResult> {
    const token = extractBearerToken(authorizationHeader)
    const cpf = extractCpfFromToken(token)

    const tdvAtual = (await this.client.buscaTdv({ token, cpf }, input.codigoTransferencia))?.result

    assertKmValida(tdvAtual, input.quilometragem)

    return { valid: true }
  }
}
