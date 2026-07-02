import type { DebitoData, ListaMultasData } from '../../clients/detran-sp-service-now-licenciamento/types'

export type MultasDetail = {
  items: ListaMultasData[]
  total: string
}

export type LicenciamentoAuth = {
  accessToken: string
  userCpf: string
}

export type LicenciamentoVeiculoAuth = LicenciamentoAuth & {
  renavam: string
  placa: string
}

export type VehicleStatus = 'REGULAR' | 'A VENCER' | 'VENCIDO'

export type VehicleItem = {
  id: string
  title: string
  plate: string
  status: VehicleStatus
  licensingExpirationDate: string
  brandModel: string
  renavam: string
  lastLicensing?: string
}

export type VerificacaoVeiculoResult = {
  vehicle: VehicleItem | null | undefined
  vigency: VehicleStatus
  isBlocked: boolean
  isGnvBlocked: boolean
  hasMultaForaDoSistema: boolean
  onlyLicensing: boolean
  hasPayableDebts: boolean
  isLicensingOverdue: boolean
  debts: DebitoData[]
  result: DebitoData[]
  totalDebits: string
  multasDetail: MultasDetail
}
