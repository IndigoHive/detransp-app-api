export type DebRestrAuth = {
  accessToken: string
  userCpf: string
}

export type DebRestrVeiculoAuth = DebRestrAuth & {
  renavam: string
  placa: string
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

export type VerificaVeiculoDebRestrResult = {
  vehicleAttributes: VehicleAttributes
  restrictions: VehicleRestrictions
}

export type TaxaCertidaoResult = {
  valor: number | null
  descricao: string | null
  vencimento: string | null
}

export type CriaQRCodeCertidaoResult = {
  qrCode: string | null
  expiresAt: string | null
}

export type VerificaQRCodeCertidaoResult = {
  estado: number | null
  confirmedDate: string | null
}

export type EmiteCertidaoResult = {
  emitida: boolean
  dataHoraEmissao: string | null
  validade: string | null
}

export type BuscaDocumentoCertidaoResult = {
  base64: string | null
}
