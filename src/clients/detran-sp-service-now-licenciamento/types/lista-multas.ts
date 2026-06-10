import type { DateString } from './_common'

export type ListaMultasData = {
  nomeOrgao: string
  dataInfracao: DateString
  autoInfracao: string
}

export type ListaMultasResult = {
  result?: ListaMultasData[]
} | null | undefined
