import type {
  CodigoEstadoQRCode,
  CodigoEstadoTDV,
  CodigoOrigemComunicacaoVendaVeiculo,
  CodigoOrigemTDV
} from './_common'

export type ListTdvsQuery = {
  ativa: 'true' | 'false'
  codigoComprador?: string
  codigoVendedor?: string
  placaVeiculo?: string
  campos?: string
}

export type ListaTdvsResultData = {
  codigoTransferenciaVeiculo?: string | null
  numeroTransferenciaVeiculo?: string | null
  ativa?: 'true' | 'false' | '1' | '0'
  estado?: CodigoEstadoTDV
  dataHoraCriacao?: string | null
  tipoProvaVida?: string | null
  placaVeiculo?: string | null
  chassiVeiculo?: string | null
  codigoRenavamVeiculo?: string | null
  numeroCrvVeiculo?: string | null
  codigoMunicipioVeiculo?: number | string | null
  nomeMunicipioVeiculo?: string | null
  codigoMarcaVeiculo?: number | string | null
  descricaoMarcaVeiculo?: string | null
  codigoCategoriaVeiculo?: number | string | null
  descricaoCategoriaVeiculo?: string | null
  codigoTipoVeiculo?: number | string | null
  descricaoTipoVeiculo?: string | null
  codigoCarroceriaVeiculo?: number | string | null
  descricaoCarroceriaVeiculo?: string | null
  codigoCorVeiculo?: number | string | null
  descricaoCorVeiculo?: string | null
  codigoCombustivelVeiculo?: number | string | null
  descricaoCombustivelVeiculo?: string | null
  codigoEspecieVeiculo?: number | string | null
  descricaoEspecieVeiculo?: string | null
  anoFabricacaoVeiculo?: number | string | null
  anoModeloVeiculo?: number | string | null
  anoExercicioVeiculo?: number | string | null
  kmVeiculo?: string | null
  valorVendaVeiculo?: string | null
  ufVeiculo?: string | null
  codigoVendedor?: string | null
  nomeVendedor?: string | null
  emailVendedor?: string | null
  codigoProvaVidaVendedor?: string | null
  codigoComprador?: string | null
  nomeComprador?: string | null
  emailComprador?: string | null
  logradouroComprador?: string | null
  numeroComprador?: string | null
  complementoComprador?: string | null
  bairroComprador?: string | null
  codigoMunicipioComprador?: number | string | null
  nomeMunicipioComprador?: string | null
  ufComprador?: string | null
  cepComprador?: string | null
  codigoProvaVidaComprador?: string | null
  autodeclaracaoResidenciaComprador?: string | null
  confirmacaoAutodeclaracaoResidenciaComprador?: 'true' | 'false' | '1' | '0' | null
  codigoAnexoAtpve?: string | null
  codigoAnexoAssinaturaVendedor?: string | null
  codigoAnexoAssinaturaComprador?: string | null
  codigoDespachante?: string | null
  numeroAtpveVeiculo?: string | null
  origemComunicacaoVendaVeiculo?: CodigoOrigemComunicacaoVendaVeiculo | null
  dataEmissaoCrvVeiculo?: string | null
  numeroLaudoVistoria?: string | null
  estadoLaudoVistoria?: string | null
  numeroEcrvVeiculo?: string | null
  anoEcrvVeiculo?: number | string | null
  codigoFinanciadoGravame?: string | null
  kmVistoriadaVeiculo?: string | null
  estadoComprador?: string | null
  codigoAnexoLaudoAuditoria?: string | null
  codigoAnexoAutodeclaracaoResidenciaComprador?: string | null
  dataInicialPagamento?: string | null
  idQRCode?: string | null
  qrCode?: string | null
  estadoQRCode?: CodigoEstadoQRCode | null
  dataExpiracaoQRCode?: string | null
  idPagamentoQRCode?: string | null
  dataPagamentoQRCode?: string | null
  origem?: CodigoOrigemTDV | null
}

export type ListaTdvsResultSuccess = {
  result: ListaTdvsResultData[]
}

export type ListaTdvsResult = ListaTdvsResultSuccess | undefined
