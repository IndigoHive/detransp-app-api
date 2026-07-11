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
  comprovante: string | null
  confirmedDate: string | null
}

export type EmiteCertidaoResult = {
  emitida: boolean
  dataHoraEmissao: string | null
  validade: string | null
  base64: string | null
}

export type BuscaDocumentoCertidaoResult = {
  base64: string | null
}

export type DebRestrVehicleItem = {
  id: string
  renavam: string
  plate: string
  title: string
  brandModel: string
}

export type ListaVeiculosDebRestrResult = {
  vehicles: DebRestrVehicleItem[]
}

export type DebtSectionStatus = 'REGULAR' | 'A VENCER' | 'VENCIDO'
export type PixButtonState = 'visible' | 'disabled' | 'hidden'

export type DebtExercicioItem = {
  exercicio: number | null
  valor: number
}

export type DebtMultaItem = {
  descricao: string
  valor: number
}

export type DetailsButtonState = 'visible' | 'hidden'

export type VehicleDebtsPayload = {
  ipva: {
    status: DebtSectionStatus
    items: DebtExercicioItem[]
    // Display keys — the card renders the total row only when totalLabel is
    // non-null and the Detalhes link only when detailsButton is visible, so
    // a REGULAR section shows neither a bogus "R$ 0,00" nor a dead link
    totalLabel: string | null
    detailsButton: DetailsButtonState
    pixButton: PixButtonState
    helperText?: string
  }
  multas: {
    status: DebtSectionStatus
    items: DebtMultaItem[]
    totalLabel: string | null
    detailsButton: DetailsButtonState
    pixButton: PixButtonState
  }
  licenciamento: {
    status: DebtSectionStatus
    items: DebtExercicioItem[]
    pixButton: PixButtonState
    helperText?: string
  }
}

export type ConsultaVehicleInfo = {
  plate: string | null
  brandModel: string | null
  renavam: string | null
  yearFab: string | null
  yearMod: string | null
  cor: string | null
  tipo: string | null
  combustivel: string | null
}

export type ConsultaRestrictions = VehicleRestrictions & {
  renainf?: string | undefined
}

export type ConsultaVeiculoDebitosResult = {
  vehicle: ConsultaVehicleInfo | null
  restrictions: ConsultaRestrictions
  hasMultaForaDoSistema: boolean
  debts: VehicleDebtsPayload | null
  totalDebits: number
  totalDebitsLabel: string
  limitReached: boolean
}

export type IpvaParcelsInfo = {
  count: number
  installmentAmount: string
  firstInstallmentLabel: string
}

export type DetalhesIpvaChip = {
  id: string
  label: string
  color: string
}

export type DetalhesIpvaItem = {
  exercicio: number | null
  valor: number
  valorLabel: string
  vencimento: string | null
  chips: DetalhesIpvaChip[]
  // payment-form options for THIS exercício; only the current exercise can offer
  // parcelamento — null while ServiceNow rejects parcelado PIX (verified 2026-07-07)
  parcels: IpvaParcelsInfo | null
}

export type DetalhesIpvaResult = {
  items: DetalhesIpvaItem[]
  total: number
  totalLabel: string
  pixUrl: string
}

export type DetalhesMultaInfracao = {
  descricao: string
  valor: number
  valorLabel: string
  data: string | null
  municipio: string | null
  orgaoAutuador: string | null
}

export type DetalhesMultasResult = {
  infracoes: DetalhesMultaInfracao[]
  total: number
  totalLabel: string
  pixUrl: string
}

export type PixDebitoTipo = 'ipva' | 'multas' | 'licenciamento' | 'total'

export type CriaPixDebitoResult = {
  qrCode: string | null
  expiresAt: string | null
  idSolServico: string | null
}

export type VerificaPixDebitoResult = {
  estado: number | null
  comprovante: string | null
  confirmedDate: string | null
}

export type CertidaoVigenteResult = {
  disponivel: boolean
  emissao: string | null
  descricao: string | null
}

// Mirrors the editor's VehicleItem (vehicle_info component). Fields the
// deb-restr scope cannot source are omitted from the type on purpose:
// licensingExpirationDate and issuanceCount don't exist in this ServiceNow scope.
export type ResumoCertidaoVehicle = {
  id: string | null
  plate: string | null
  title: string | null
  brandModel: string | null
  renavam: string | null
  yearFab: string | null
  yearMod: string | null
  type: string | null
  licensingStatus: string | null
  debtsStatus: string | null
  restrictionStatus: string | null
  lastLicensing: string | null
  lastIssuance: string | null
}

export type ResumoCertidaoResult = {
  vehicle: ResumoCertidaoVehicle
  taxa: {
    valor: number | null
    valorLabel: string | null
    descricao: string | null
    vencimento: string | null
  }
}
