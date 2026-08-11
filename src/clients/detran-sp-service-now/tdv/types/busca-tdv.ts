import type { CodigoEstadoTDV, CodigoEstadoQRCode, CodigoOrigemComunicacaoVendaVeiculo, CodigoOrigemTDV } from './_common'

export type BuscaTdvResultData = {
  // Despite the swagger doc declaring 'true'/'false', the real API returns '1'/'0' here.
  ativa?: string
  estado?: CodigoEstadoTDV
  origem?: CodigoOrigemTDV
  origemComunicacaoVendaVeiculo?: CodigoOrigemComunicacaoVendaVeiculo
  codigoTransferenciaVeiculo?: string
  placaVeiculo?: string
  placaMercosul?: 'true' | 'false'
  descricaoMarcaVeiculo?: string
  descricaoCorVeiculo?: string
  codigoRenavamVeiculo?: string
  codigoMunicipioVeiculo?: string
  nomeMunicipioVeiculo?: string
  codigoComprador?: string
  codigoVendedor?: string
  nomeComprador?: string
  nomeVendedor?: string
  emailComprador?: string
  emailVendedor?: string
  cepComprador?: string
  bairroComprador?: string
  logradouroComprador?: string
  numeroComprador?: string
  complementoComprador?: string
  codigoMunicipioComprador?: string
  nomeMunicipioComprador?: string
  ufComprador?: string
  valorVendaVeiculo?: string
  kmVeiculo?: string
  kmVistoriadaVeiculo?: string
  estadoQRCode?: CodigoEstadoQRCode
  qrCode?: string
  dataExpiracaoQRCode?: string
  autodeclaracaoResidenciaComprador?: string
}

export type BuscaTdvResultSuccess = {
  result: BuscaTdvResultData
}

export type BuscaTdvResult = BuscaTdvResultSuccess | undefined
