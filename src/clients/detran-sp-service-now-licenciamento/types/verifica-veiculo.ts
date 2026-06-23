import type { DateString, HrefLink, Placa, Renavam, SituacaoLicenciamento } from './_common'

export type VerificaVeiculoData = {
  self: HrefLink
  codigoRenavamVeiculo: Renavam
  dataVencimentoLicenciamento: DateString
  marcaVeiculo: string
  placaVeiculo: Placa
  situacaoLicenciamento: SituacaoLicenciamento
  debitos: HrefLink
  qrCode: HrefLink
  crlve: HrefLink
}

export type VerificaVeiculoResult =
  | { result?: VerificaVeiculoData }
  | null
  | undefined
