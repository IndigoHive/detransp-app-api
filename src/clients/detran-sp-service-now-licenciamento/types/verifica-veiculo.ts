import type { DateString, HrefLink, Placa, Renavam, SituacaoLicenciamento } from './_common'

export type VerificaVeiculoData = {
  self: HrefLink
  codigoRenavamVeiculo: Renavam
  dataVencimentoLicenciamento: DateString
  dataUltimoExercicio: string
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

export type BuscaVeiculoResult =
  | { result?: VerificaVeiculoData }
  | null
  | undefined
