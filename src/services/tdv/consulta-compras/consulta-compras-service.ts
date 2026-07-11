import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

export type ConsultaComprasResult = {
  vehicles: Array<{
    id: string
    title: string
    plate: string
    licensingStatus: string
    licensingExpirationDate: string
    type: string
    brandModel: string
    renavam: string
    lastLicensing: string
    yearFab: string
    yearMod: string
    codigoTransferencia: string
  }>
}

export class ConsultaComprasService {
  private readonly client: DetranSpServiceNowTdvClient

  constructor ({ detranSpServiceNowTdv }: Dependencies) {
    this.client = detranSpServiceNowTdv
  }

  async run (authorizationHeader: string | undefined): Promise<ConsultaComprasResult> {
    const token = extractBearerToken(authorizationHeader)
    const cpf = extractCpfFromToken(token)
    const auth = { token, cpf }

    const result = await this.client.listaTdvs(auth, {
      ativa: 'true',
      codigoComprador: cpf
    })

    if (!result?.result) {
      return { vehicles: [] }
    }

    const vehicles = result.result.map((tdv, index) => ({
      id: String(index + 1),
      title: tdv.descricaoMarcaVeiculo ?? '',
      plate: tdv.placaVeiculo ?? '',
      licensingStatus: 'PENDENTE',
      licensingExpirationDate: '',
      type: 'Passeio',
      brandModel: tdv.descricaoMarcaVeiculo ?? '',
      renavam: tdv.codigoRenavamVeiculo ?? '',
      lastLicensing: '',
      yearFab: '',
      yearMod: '',
      codigoTransferencia: tdv.codigoTransferenciaVeiculo ?? ''
    }))

    return { vehicles }
  }
}
