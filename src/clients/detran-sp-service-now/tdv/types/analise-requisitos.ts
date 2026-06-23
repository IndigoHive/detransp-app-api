export type AnaliseRequisitosInput = {
  codigoRenavam: string
  placaVeiculo: string
  cpfVendedor: string
}

export type AnaliseRequisitosResult = {
  possuiRestricao: boolean
  tdvAberta: boolean
  codigoTransferenciaVeiculo?: string
}
