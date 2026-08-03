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
  correlationId?: string
}

export type VerificaVeiculoServiceNowBody = {
  uuid: string
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
    motivo: string
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

export type VerificaVeiculoResult =
  | {
      result?: {
        success: boolean
        message: string
        number?: string
        correlationID?: string
        correlationId?: string
        data?: {
          process: string
          body?: VerificaVeiculoServiceNowBody
        }
      }
    }
  | null
  | undefined
