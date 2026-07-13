import type { DateString } from './_common'

export type ListaDebitosTipoServicoRef = {
  // "tipos-servico" for MILT/IPVA; "debitos-licenciamento" for licensing-only vehicles
  type?: string
  id?: string
}

export type ListaDebitosIncludedAttributes = {
  // included[type=tipos-servico]
  codigoservico?: string | null
  descricao?: string | null
  ipvaParcelado?: boolean
  ipvaAnterior?: boolean
  // included[type=debitos-*]
  exercicio?: number
  dataVencimento?: DateString
  // number for licenciamento, string for milt (observed 2026-07-06)
  valor?: number | string
  // ServiceNow sends this as the string "true"/"false"
  cobrarLicenciamento?: string | boolean
  autoInfracao?: string
  data?: DateString
  hora?: string
  local?: string
  municipio?: string
  nomeOrgao?: string
  orgaoAutuador?: { codigo?: string; nome?: string }
}

export type ListaDebitosIncluded = {
  type: string
  id: string
  attributes?: ListaDebitosIncludedAttributes
}

export type ListaDebitosData = {
  id?: string
  type?: string
  attributes?: {
    bloqueio?: string | null
  }
  relationships?: {
    // single object in older responses, array as of 2026-07-06
    'tipo-servico'?: { data?: ListaDebitosTipoServicoRef | ListaDebitosTipoServicoRef[] | null }
    veiculos?: { data?: { type?: string; id?: string } | null }
  }
}

export type ListaDebitosResponse = {
  data?: ListaDebitosData
  included?: ListaDebitosIncluded[]
  meta?: {
    qtdDebitos?: number
    valorDebitos?: number
    // per-type keys observed 2026-07-06
    qtdeDebitosMILT?: number
    valorDebitosMILT?: number
  }
}

export type ListaDebitosResult = ListaDebitosResponse | null | undefined
