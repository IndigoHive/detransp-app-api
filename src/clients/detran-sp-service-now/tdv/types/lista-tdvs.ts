import type { CodigoEstadoTDV } from './_common'

export type ListTdvsQuery = {
  ativa: 'true' | 'false'
  codigoComprador?: string
  codigoVendedor?: string
  placaVeiculo?: string
}

export type ListaTdvsResultData = {
  ativa?: 'true' | 'false'
  estado?: CodigoEstadoTDV
  codigoTransferenciaVeiculo?: string
  placaVeiculo?: string
  descricaoMarcaVeiculo?: string
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
