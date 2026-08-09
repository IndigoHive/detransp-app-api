import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { CodigoEstadoTDV } from '../../../clients/detran-sp-service-now/tdv/types'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

export type ValidaAssinaturaInput = {
  codigoTransferencia: string
  itiCode?: string
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

  async run (authorizationHeader: string | undefined, input: ValidaAssinaturaInput): Promise<ValidaAssinaturaResult> {
    const token = extractBearerToken(authorizationHeader)
    const cpf = extractCpfFromToken(token)
    const auth = { token, cpf }

    const tdv = await this.client.buscaTdv(auth, input.codigoTransferencia)
    const estado = tdv?.result?.estado

    if (!estado) {
      return { valid: false }
    }

    // Determine role from TDV data
    const isSeller = tdv.result?.codigoVendedor === cpf

    // The ITI WebView hands back a signing authorization code, not a signed/unsigned flag.
    // Forward it to ServiceNow so it can advance the TDV to the next signature state
    // (5 -> 6 when the buyer signs, 6 -> 7 when the seller signs). ServiceNow itself
    // performs the ITI code exchange; we only need to attach it to the right transition.
    let effectiveEstado = estado
    if (input.itiCode) {
      if (!isSeller && estado === CodigoEstadoTDV.AUTODECLARACAO_RESIDENCIA_CONFIRMADA) {
        await this.client.atualizaTdv(auth, input.codigoTransferencia, {
          estado: CodigoEstadoTDV.ATPVE_ASSINADA_COMPRADOR,
          itiCode: input.itiCode,
          confirmacaoTermoCienciaResponsabilidade: true
        })
        effectiveEstado = CodigoEstadoTDV.ATPVE_ASSINADA_COMPRADOR
      } else if (isSeller && estado === CodigoEstadoTDV.ATPVE_ASSINADA_COMPRADOR) {
        await this.client.atualizaTdv(auth, input.codigoTransferencia, {
          estado: CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA,
          itiCode: input.itiCode
        })
        effectiveEstado = CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA
      }
      // If the state doesn't match the expected precondition (e.g. a retried call after the
      // transition already happened), fall through and just report the current signed status.
    }

    if (isSeller) {
      return { valid: SELLER_SIGNED_STATES.includes(effectiveEstado) }
    }

    return { valid: BUYER_SIGNED_STATES.includes(effectiveEstado) }
  }
}
