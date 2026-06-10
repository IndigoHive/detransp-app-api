import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { extractBearerToken } from '../../../utils/token'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

export type ValidacaoVendaInput = {
  codigoTransferencia: string
  valorVenda: string
  km: string
  cepComprador: string
}

export type ValidacaoVendaResult = {
  valid: boolean
  cidadeDiferente: boolean
}

export class ValidacaoVendaService {
  private readonly client: DetranSpServiceNowTdvClient

  constructor ({ detranSpServiceNowTdv }: Dependencies) {
    this.client = detranSpServiceNowTdv
  }

  async run (authorizationHeader: string | undefined, input: ValidacaoVendaInput): Promise<ValidacaoVendaResult> {
    const token = extractBearerToken(authorizationHeader)

    // Fetch transfer details to compare vehicle municipality with buyer municipality
    const tdv = await this.client.buscaTdv(token, input.codigoTransferencia)

    if (!tdv?.result) {
      return { valid: false, cidadeDiferente: false }
    }

    const vehicleMunicipio = tdv.result.codigoMunicipioVeiculo
    const enderecoResult = await this.client.buscaEndereco(token, input.cepComprador)

    const buyerMunicipio = enderecoResult?.result?.codigoMunicipio?.toString()

    // Check if vehicle needs Mercosul plate (different city + non-Mercosul plate)
    const cidadeDiferente = !!(
      vehicleMunicipio &&
      buyerMunicipio &&
      vehicleMunicipio !== buyerMunicipio &&
      tdv.result.placaMercosul === 'false'
    )

    return {
      valid: true,
      cidadeDiferente
    }
  }
}
