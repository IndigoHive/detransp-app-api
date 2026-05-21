export type HrefLink = {
  href: string
}

export type SituacaoLicenciamento =
  | 'Atrasado'
  | 'À vencer'
  | 'Em dia'
  | 'Pendente'
  | 'Licenciamento em dia'
  | 'Licenciamento a vencer'
  | 'Licenciamento atrasado'
  | 'Licenciamento pendente'

type SituacaoLicenciamentoNormalizada = 'Atrasado' | 'À vencer' | 'Em dia' | 'Pendente'

const situacaoLicenciamentoMap: Record<SituacaoLicenciamento, SituacaoLicenciamentoNormalizada> = {
  Atrasado: 'Atrasado',
  'Em dia': 'Em dia',
  'Licenciamento a vencer': 'À vencer',
  'Licenciamento atrasado': 'Atrasado',
  'Licenciamento em dia': 'Em dia',
  'Licenciamento pendente': 'Pendente',
  Pendente: 'Pendente',
  'À vencer': 'À vencer'
}

export function normalizeSituacaoLicenciamento (situacao: SituacaoLicenciamento): SituacaoLicenciamentoNormalizada {
  return situacaoLicenciamentoMap[situacao] ?? situacao
}

export const enum EstadoQRCode {
  Ativo = 1,
  Pago = 2,
  Expirado = 3
}

export type QRCodeData = {
  self: HrefLink
  idQRCode: string
  qrCode: string
  dataExpiracaoQRCode: string
  estadoQRCode: EstadoQRCode
  idPagamentoQRCode: string | null
  dataPagamentoQRCode: string | null
}

export type DateString = string
export type ISODateTimeString = string
export type Base64String = string
export type EMVString = string
export type Renavam = string
export type Placa = string
export type BearerToken = string
