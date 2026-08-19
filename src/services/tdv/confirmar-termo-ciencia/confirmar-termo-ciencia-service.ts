import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { CodigoEstadoTDV, CodigoOrigemTDV } from '../../../clients/detran-sp-service-now/tdv/types'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'
import { isTermoCienciaConfirmado } from '../termo-ciencia'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

export type ConfirmarTermoCienciaInput = {
  codigoTransferencia: string
}

export type ConfirmarTermoCienciaResult = Record<string, never>

const SELLER_SIGNED_STATES: string[] = [
  CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA,
  CodigoEstadoTDV.TAXA_SERVICO_PAGA,
  CodigoEstadoTDV.TRANSFERENCIA_CONCLUIDA
]

export class ConfirmarTermoCienciaService {
  private readonly client: DetranSpServiceNowTdvClient

  constructor ({ detranSpServiceNowTdv }: Dependencies) {
    this.client = detranSpServiceNowTdv
  }

  async run (authorizationHeader: string | undefined, input: ConfirmarTermoCienciaInput): Promise<ConfirmarTermoCienciaResult> {
    const token = extractBearerToken(authorizationHeader)
    const cpf = extractCpfFromToken(token)
    const auth = { token, cpf }

    const tdv = (await this.client.buscaTdv(auth, input.codigoTransferencia))?.result

    if (
      tdv?.origem === CodigoOrigemTDV.ENTRADA_RENAVE
      && !isTermoCienciaConfirmado(tdv)
      && !SELLER_SIGNED_STATES.includes(tdv.estado ?? '')
    ) {
      await this.client.atualizaTdv(auth, input.codigoTransferencia, {
        estado: CodigoEstadoTDV.ATPVE_ASSINADA_COMPRADOR,
        confirmacaoTermoCienciaResponsabilidade: true
      })
    }

    return {}
  }
}
