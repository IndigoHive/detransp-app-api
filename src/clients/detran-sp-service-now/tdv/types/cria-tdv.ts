import type { CodigoEstadoTDV, CodigoOrigemComunicacaoVendaVeiculo, CodigoOrigemTDV } from './_common'

export type CriaTdvCommand = {
  codigoRenavamVeiculo: string
  placaVeiculo: string
  nomeVendedor: string
  emailVendedor: string
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

export type CriaTdvResultSuccess = {
  result: {
    codigoTransferenciaVeiculo: string
  }
}

export type CriaTdvResult = CriaTdvResultSuccess | undefined
