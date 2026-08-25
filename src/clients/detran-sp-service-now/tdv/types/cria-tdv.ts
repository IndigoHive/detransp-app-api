import type { CodigoEstadoTDV, CodigoOrigemComunicacaoVendaVeiculo, CodigoOrigemTDV } from './_common'
import type { ListaTdvsResultData } from './lista-tdvs'

export type CriaTdvCommandCurado = {
  codigoRenavamVeiculo: string
  placaVeiculo: string
  nomeVendedor: string
  // Optional because the buyer-side journeys (TDV 2.0/3.0/6.0) only know the seller's e-mail
  // if the comunicação de venda carried it — the TDV schema does not require it.
  emailVendedor?: string
  codigoVendedor: string
  origem: CodigoOrigemTDV
  ativa?: 'true' | 'false'
  estado?: CodigoEstadoTDV
  origemComunicacaoVendaVeiculo?: CodigoOrigemComunicacaoVendaVeiculo
  codigoTransferenciaVeiculo?: string
  descricaoMarcaVeiculo?: string
  codigoComprador?: string
  nomeComprador?: string
  nomeMunicipioVeiculo?: string
  nomeMunicipioComprador?: string
  cepComprador?: string
  bairroComprador?: string
  logradouroComprador?: string
  numeroComprador?: string
  complementoComprador?: string
  chassiVeiculo?: string
  kmVeiculo?: string
  kmVistoriadaVeiculo?: string
  confirmacaoAutodeclaracaoResidenciaComprador?: 'true'
}

// The buyer journeys (TDV 2.0/3.0/6.0) don't assemble a payload: they echo the comunicação de
// venda back exactly as ServiceNow listed it, adding only the residence confirmation — which is
// what the app in production posts (getCriarComunicacaoVendaEnotariado).
export type CriaTdvCommandRegistro = ListaTdvsResultData & {
  confirmacaoAutodeclaracaoResidenciaComprador: 'true'
}

export type CriaTdvCommand = CriaTdvCommandCurado | CriaTdvCommandRegistro

export type CriaTdvResultSuccess = {
  result: {
    codigoTransferenciaVeiculo: string
  }
}

export type CriaTdvResult = CriaTdvResultSuccess | undefined
