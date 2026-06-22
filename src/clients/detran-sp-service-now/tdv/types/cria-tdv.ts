import type { CodigoOrigemTDV } from './_common'

export type CriaTdvCommand = {
  codigoRenavamVeiculo: string
  placaVeiculo: string
  nomeVendedor: string
  emailVendedor: string
  codigoVendedor: string
  origem: CodigoOrigemTDV
}

export type CriaTdvResultSuccess = {
  result: {
    codigoTransferenciaVeiculo: string
  }
}

export type CriaTdvResult = CriaTdvResultSuccess | undefined
