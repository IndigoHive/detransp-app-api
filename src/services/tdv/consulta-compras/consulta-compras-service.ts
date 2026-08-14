import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'
import { acaoComoComprador, type ProximaAcaoComprador } from '../proxima-acao-comprador'

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
    proximaAcao: ProximaAcaoComprador
    nomeComprador: string
    nomeVendedor: string
    descricaoCorVeiculo: string
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

    // Only list purchases the buyer can actually act on right now — a TDV still waiting on
    // the seller has nothing for this screen to route into once picked.
    const vehicles = result.result.flatMap((tdv, index) => {
      const proximaAcao = acaoComoComprador(tdv.estado)
      if (!proximaAcao) return []

      return [{
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
        codigoTransferencia: tdv.codigoTransferenciaVeiculo ?? '',
        proximaAcao,
        nomeComprador: tdv.nomeComprador ?? '',
        nomeVendedor: tdv.nomeVendedor ?? '',
        descricaoCorVeiculo: tdv.descricaoCorVeiculo ?? ''
      }]
    })

    return { vehicles }
  }
}
