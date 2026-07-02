import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { CodigoEstadoTDV } from '../../../clients/detran-sp-service-now/tdv/types'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

export type ValidaAssinaturaInput = {
  codigoTransferencia: string
}

export type ValidaAssinaturaResult = {
  valid: boolean
}

const BUYER_SIGNED_STATES: string[] = [
  CodigoEstadoTDV.ATPVE_ASSINADA_COMPRADOR,
  CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA,
  CodigoEstadoTDV.TAXA_SERVICO_PAGA,
  CodigoEstadoTDV.TRANSFERENCIA_CONCLUIDA
]

const SELLER_SIGNED_STATES: string[] = [
  CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA,
  CodigoEstadoTDV.TAXA_SERVICO_PAGA,
  CodigoEstadoTDV.TRANSFERENCIA_CONCLUIDA
]

export class ValidaAssinaturaService {
  private readonly client: DetranSpServiceNowTdvClient

  constructor ({ detranSpServiceNowTdv }: Dependencies) {
    this.client = detranSpServiceNowTdv
  }

  async run (accessToken: string, cpf: string, input: ValidaAssinaturaInput): Promise<ValidaAssinaturaResult> {
    const tdv = await this.client.buscaTdv(accessToken, input.codigoTransferencia)
    const estado = tdv?.result?.estado

    if (!estado) {
      return { valid: false }
    }

    const isSeller = tdv.result?.codigoVendedor === cpf

    if (isSeller) {
      return { valid: SELLER_SIGNED_STATES.includes(estado) }
    }

    return { valid: BUYER_SIGNED_STATES.includes(estado) }
  }
}
