import type { DateString, HrefLink, Placa, Renavam, SituacaoLicenciamento } from './_common'

export type ListaVeiculosVeiculoData = {
  self: HrefLink
  codigoRenavamVeiculo: Renavam
  dataLicenciamentoVeiculo: DateString
  dataVencimentoLicenciamento: DateString
  marcaVeiculo: string
  placaVeiculo: Placa
  situacaoLicenciamento: SituacaoLicenciamento
  debitos: HrefLink
  qrCode: HrefLink
  crlve: HrefLink
}

export type ListaVeiculosResult =
  | { result?: ListaVeiculosVeiculoData[] }
  | null
  | undefined
