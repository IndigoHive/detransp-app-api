import type { Confiabilidade, IdpSpGovBrServiceClient, Selo } from '../../../clients'
import { SELO_LEVELS } from '../selo-levels'

export type GetConfiabilidadesInput = {
  accessToken: string
}

export type GetConfiabilidadesResult = {
  data: Confiabilidade[]
  highestSelo: Selo | null
}

type Dependencies = {
  idpSpGovBrService: IdpSpGovBrServiceClient
}

export class GetConfiabilidadesService {
  private readonly idpSpGovBrService: IdpSpGovBrServiceClient

  constructor ({ idpSpGovBrService }: Dependencies) {
    this.idpSpGovBrService = idpSpGovBrService
  }

  async run (input: GetConfiabilidadesInput): Promise<GetConfiabilidadesResult> {
    const data = await this.idpSpGovBrService.listConfiabilidades(input.accessToken) ?? []

    return {
      data,
      highestSelo: this.getHighestSelo(data)
    }
  }

  private getHighestSelo (confiabilidades: Confiabilidade[]): Selo | null {
    if (!confiabilidades.length) {
      return null
    }

    return confiabilidades.reduce((prev, current) =>
      SELO_LEVELS[current.selo] > SELO_LEVELS[prev.selo] ? current : prev
    ).selo
  }
}
