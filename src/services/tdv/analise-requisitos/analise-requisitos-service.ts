import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import {
  CodigoEstadoTDV,
  type CodigoOrigemTDV,
  type ListaTdvsResultData
} from '../../../clients/detran-sp-service-now/tdv/types'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

export type AnaliseRequisitosInput = {
  selectedVehicle: {
    plate: string
    renavam: string
    [key: string]: unknown
  }
}

export type AnaliseRequisitosResult = {
  hasRestriction: boolean
  hasActiveTDV: boolean
  codigoTransferencia?: string | undefined
  // Raw ServiceNow estado of the active TDV, if any — lets the flow branch resume
  // behavior (e.g. skip straight to the final confirmation once sale data is already in).
  estado?: string | undefined
  // Set only when the picked vehicle is ready to move straight into a specific step —
  // 'vendedor_2' when the buyer already signed and it's the seller's turn, 'nova_tdv' when
  // there's nothing blocking a brand new sale. Left unset for every other active state
  // (including states 1-5, still resumable by the seller) — those go through the existing
  // "TDV aberta?" prompt instead, which is also where cancellation (allowed up to estado 6)
  // is offered.
  proximaAcao?: 'vendedor_2' | 'nova_tdv' | undefined
  // Buyer name, surfaced once known so the seller's re-entry screens (e.g. "comprador assinou")
  // can display who signed without a separate lookup.
  nomeComprador?: string | undefined
  // Vehicle color, same rationale as nomeComprador — the seller's re-entry screens show it
  // without a separate vehicle lookup.
  descricaoCorVeiculo?: string | undefined
  // TDV.origem from ServiceNow — the seller flow branches on this after liveness
  // (origem 5 = Entrada Renave / venda para loja). Not present on the vehicle list.
  origem?: CodigoOrigemTDV | undefined
  cpfComprador?: string | undefined
  emailComprador?: string | undefined
  enderecoComprador?: string | undefined
}

function trimField (value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}

function formatEnderecoComprador (tdv: ListaTdvsResultData): string | undefined {
  const logradouro = trimField(tdv.logradouroComprador)
  const numero = trimField(tdv.numeroComprador)
  const complemento = trimField(tdv.complementoComprador)
  const bairro = trimField(tdv.bairroComprador)
  const municipio = trimField(tdv.nomeMunicipioComprador)
  const uf = trimField(tdv.ufComprador)
  const cep = trimField(tdv.cepComprador)
  const municipioUf = municipio
    ? (uf ? `${municipio} - ${uf}` : municipio)
    : uf

  const endereco = [logradouro, numero, complemento, bairro, municipioUf, cep]
    .filter(Boolean)
    .join(', ')

  return endereco || undefined
}

// The seller only has a forced next step once the buyer has already signed (estado 6) — every
// other active state, including still filling in buyer/sale data (1-2) or waiting on the buyer
// (3-5), goes through the "TDV aberta?" prompt so cancellation stays available up to estado 6.
function proximaAcaoParaVendedor (estado: CodigoEstadoTDV | undefined): AnaliseRequisitosResult['proximaAcao'] {
  switch (estado) {
    case CodigoEstadoTDV.ATPVE_ASSINADA_COMPRADOR: return 'vendedor_2'
    default: return undefined
  }
}

export class AnaliseRequisitosService {
  private readonly client: DetranSpServiceNowTdvClient

  constructor ({ detranSpServiceNowTdv }: Dependencies) {
    this.client = detranSpServiceNowTdv
  }

  async run (authorizationHeader: string | undefined, input: AnaliseRequisitosInput): Promise<AnaliseRequisitosResult> {
    const token = extractBearerToken(authorizationHeader)
    const cpf = extractCpfFromToken(token)
    const auth = { token, cpf }

    // Check for existing active TDV on this plate
    const tdvs = await this.client.listaTdvs(auth, {
      ativa: 'true',
      codigoVendedor: cpf,
      placaVeiculo: input.selectedVehicle.plate
    })

    // ServiceNow's `ativa` field is the string "1"/"0", not "true"/"false" — the ?ativa=true
    // query param already filters server-side, so estado is the only client-side check needed.
    const activeTdv = tdvs?.result?.find(
      tdv => tdv.estado !== CodigoEstadoTDV.TRANSFERENCIA_CANCELADA
    )

    if (activeTdv) {
      const enderecoComprador = formatEnderecoComprador(activeTdv)
      const cpfComprador = trimField(activeTdv.codigoComprador)
      const emailComprador = trimField(activeTdv.emailComprador)
      return {
        hasRestriction: false,
        hasActiveTDV: true,
        codigoTransferencia: activeTdv.codigoTransferenciaVeiculo ?? undefined,
        estado: activeTdv.estado,
        proximaAcao: proximaAcaoParaVendedor(activeTdv.estado),
        nomeComprador: activeTdv.nomeComprador,
        descricaoCorVeiculo: activeTdv.descricaoCorVeiculo,
        ...(activeTdv.origem != null ? { origem: activeTdv.origem } : {}),
        ...(cpfComprador ? { cpfComprador } : {}),
        ...(emailComprador ? { emailComprador } : {}),
        ...(enderecoComprador ? { enderecoComprador } : {})
      }
    }

    const hasRestriction = false // TODO: real restriction check not implemented yet

    return {
      hasRestriction,
      hasActiveTDV: false,
      proximaAcao: hasRestriction ? undefined : 'nova_tdv'
    }
  }
}
