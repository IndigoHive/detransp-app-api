import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { formatCityName } from '../../../utils/format-city-name'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

export type ValidacaoVendaInput = {
  placaVeiculo: string
  renavamVeiculo: string
  cpfComprador: string
  cepComprador: string
  valorVenda: string
  quilometragem: string
}

export type ValidacaoVendaResult = {
  cidadesDiferentes: boolean
}

export class ValidacaoVendaService {
  private readonly client: DetranSpServiceNowTdvClient

  constructor ({ detranSpServiceNowTdv }: Dependencies) {
    this.client = detranSpServiceNowTdv
  }

  async run (authorizationHeader: string | undefined, input: ValidacaoVendaInput): Promise<ValidacaoVendaResult> {
    const token = extractBearerToken(authorizationHeader)
    const cpf = extractCpfFromToken(token)
    const auth = { token, cpf }

    // Fetch vehicle data to get municipality and plate type
    const veiculosResult = await this.client.listaVeiculosProprietario(auth)
    const veiculo = veiculosResult?.result?.find(v => v.placa === input.placaVeiculo)

    if (!veiculo) {
      return { cidadesDiferentes: false }
    }

    // If plate is already Mercosul, no city restriction applies
    if (veiculo.placaMercosul === 'true') {
      return { cidadesDiferentes: false }
    }

    // Check buyer's municipality from CEP
    const enderecoResult = await this.client.buscaEndereco(auth, input.cepComprador)
    const buyerMunicipio = enderecoResult?.result?.municipio
    const vehicleMunicipio = veiculo.nomeMunicipio

    const cidadesDiferentes = !!(
      vehicleMunicipio &&
      buyerMunicipio &&
      formatCityName(vehicleMunicipio) !== formatCityName(buyerMunicipio)
    )

    return { cidadesDiferentes }
  }
}
