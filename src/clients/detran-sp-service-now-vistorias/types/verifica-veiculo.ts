import type { VistoriaService, VistoriaVehicle } from './_common'

export type VerificaVeiculoBody = {
  placa: string
  renavam: string
  tipo: 'ESTRUTURA' | 'IDENTIFICACAO' | 'SEGURANCA'
  subtipo: `${'ESTRUTURA' | 'IDENTIFICACAO' | 'SEGURANCA'}_${number}`
}

export type VerificaVeiculoResponseData = {
  vehicle: VistoriaVehicle | null
  service: VistoriaService | null
  totalDebits: string | null
  numeroPEV: string | null
  correlationId?: string
}

export type VerificaVeiculoServiceNowBody = {
  uuid: string
  isSingle: boolean
  veiculo: {
    placa: string
    renavam: string
    chassi: string
    marcaModelo: string
    anoModelo: number
    anoFabricacao: number
    cor: string
    categoria: string
    municipio: string
    docProprietario: string
    uf: string
  }
  elegibilidade: {
    podeVistoriar: boolean
    motivo: string | null
  }
  tarifa: {
    id: string
    tipo: string
    valor: number
    moeda: string
    origem: string
    vigencia: string
  }
}

type VerificaVeiculoSuccessResult = {
  success: true
  message: string
  correlationID: string
  data: {
    process: 'success'
    body: VerificaVeiculoServiceNowBody
  }
  items: Array<{
    placa: string
    renavam: string
    number: string
    correlationID: string
  }>
  errors: unknown[]
}

type VerificaVeiculoFailureResult = {
  success: false
  message: string
  correlationID?: string
}

export type VerificaVeiculoResult =
  | {
    result?: VerificaVeiculoSuccessResult | VerificaVeiculoFailureResult
  }
  | null
  | undefined
