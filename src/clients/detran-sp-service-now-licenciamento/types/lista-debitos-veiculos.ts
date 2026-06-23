import type { DateString } from './_common'

export type DebitoLicenciamentoData = {
  self: string
  tipoServico: 5
  nomeServico: 'Licenciamento'
  valor: number
  exercício?: number
  exercicio?: number
}

export type DebitoIPVAData = {
  self: string
  tipoServico: 6
  nomeServico: 'IPVA'
  valor: number
  exercício?: number
  exercicio?: number
  cota: number
}

export type DebitoMultaData = {
  self: string
  tipoServico: 7
  nomeServico: 'Multa Milt'
  valor: number
  autoInfracao: string
  nomeOrgao: string
  dataInfracao: DateString
}

export type DebitoData = DebitoLicenciamentoData | DebitoIPVAData | DebitoMultaData

export type ListaDebitosVeiculoResult =
  | { result?: DebitoData[] }
  | null
  | undefined
