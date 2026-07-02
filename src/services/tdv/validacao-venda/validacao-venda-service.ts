import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'

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

  async run (accessToken: string, input: ValidacaoVendaInput): Promise<ValidacaoVendaResult> {
    const veiculosResult = await this.client.listaVeiculosProprietario(accessToken)
    const veiculo = veiculosResult?.result?.find(v => v.placa === input.placaVeiculo)

    if (!veiculo) {
      return { cidadesDiferentes: false }
    }

    if (veiculo.placaMercosul === 'true') {
      return { cidadesDiferentes: false }
    }

    const enderecoResult = await this.client.buscaEndereco(accessToken, input.cepComprador)
    const buyerMunicipio = enderecoResult?.result?.codigoMunicipio?.toString()
    const vehicleMunicipio = veiculo.codigoMunicipio

    const cidadesDiferentes = !!(
      vehicleMunicipio &&
      buyerMunicipio &&
      vehicleMunicipio !== buyerMunicipio
    )

    return { cidadesDiferentes }
  }
}
