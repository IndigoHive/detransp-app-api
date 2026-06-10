import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { CodigoEstadoTDV } from '../../../clients/detran-sp-service-now/tdv/types'
import { extractBearerToken } from '../../../utils/token'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

export type ValidaAssinaturaInput = {
  codigoTransferencia: string
  itiCode: string
  role: 'comprador' | 'vendedor'
}

export type ValidaAssinaturaResult = {
  valid: boolean
}

export class ValidaAssinaturaService {
  private readonly client: DetranSpServiceNowTdvClient

  constructor ({ detranSpServiceNowTdv }: Dependencies) {
    this.client = detranSpServiceNowTdv
  }

  async run (authorizationHeader: string | undefined, input: ValidaAssinaturaInput): Promise<ValidaAssinaturaResult> {
    const token = extractBearerToken(authorizationHeader)

    if (input.role === 'comprador') {
      // First confirm autodeclaração (state 4 → 5)
      await this.client.atualizaTdv(token, input.codigoTransferencia, {
        estado: CodigoEstadoTDV.AUTODECLARACAO_RESIDENCIA_CONFIRMADA,
        codigoProvaVidaComprador: '',
        tipoProvaVidaComprador: '2',
        confirmacaoAutodeclaracaoResidenciaComprador: 'true'
      })

      // Then sign (state 5 → 6)
      await this.client.atualizaTdv(token, input.codigoTransferencia, {
        estado: CodigoEstadoTDV.ATPVE_ASSINADA_COMPRADOR,
        itiCode: input.itiCode
      })
    } else {
      // Seller sign (state 6 → 7)
      await this.client.atualizaTdv(token, input.codigoTransferencia, {
        estado: CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA,
        itiCode: input.itiCode
      })
    }

    return { valid: true }
  }
}
