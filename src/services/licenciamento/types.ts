import type { DebitoData, ListaMultasData } from '../../clients/detran-sp-service-now-licenciamento/types'

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

export type VehicleAttributes = {
  chassi?: string | undefined
  yearFab?: string | undefined
  yearMod?: string | undefined
  cor?: string | undefined
  combustivel?: string | undefined
  tipo?: string | undefined
}

export type VehicleRestrictions = {
  bloqueioFurtoRoubo?: string | undefined
  restricaoTributaria?: string | undefined
  restricaoAdministrativa?: string | undefined
  restricaoJudicial?: string | undefined
  restricaoVeiculoGuinchado?: string | undefined
  nomeAgente?: string | null | undefined
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
  multasDetail: Record<string, ListaMultasData[]>
}
