import type { CodigoEstadoTDV } from './_common'

export type ListTdvsQuery = {
  ativa: 'true' | 'false'
  codigoComprador?: string
  codigoVendedor?: string
  placaVeiculo?: string
}

export type ListaTdvsResultData = {
  // Despite the swagger doc declaring 'true'/'false', the real API returns '1'/'0' here.
  ativa?: string
  estado?: CodigoEstadoTDV
  codigoTransferenciaVeiculo?: string
  placaVeiculo?: string
  descricaoMarcaVeiculo?: string
  descricaoCorVeiculo?: string
  codigoRenavamVeiculo?: string
  codigoComprador?: string
  codigoVendedor?: string
  nomeComprador?: string
  nomeVendedor?: string
  nomeMunicipioVeiculo?: string
  nomeMunicipioComprador?: string
}

export type ListaTdvsResultSuccess = {
  result: ListaTdvsResultData[]
}

export type ListaTdvsResult = ListaTdvsResultSuccess | undefined
