import type { CodigoEstadoTDV } from './_common'

export type AtualizaTdvDadosVendaInformados = {
  estado: CodigoEstadoTDV.DADOS_VENDA_INFORMADOS
  codigoComprador: string
  nomeComprador: string
  emailComprador: string
  cepComprador: string
  bairroComprador: string
  logradouroComprador: string
  numeroComprador: string
  complementoComprador: string
  valorVendaVeiculo: string
  kmVeiculo: string
  codigoProvaVidaVendedor: string
  tipoProvaVidaVendedor: string
}

export type AtualizaTdvAtpveCriada = {
  estado: CodigoEstadoTDV.ATPVE_CRIADA
  codigoProvaVidaVendedor: string
  tipoProvaVidaVendedor: string
}

export type AtualizaTdvIntencaoCompraConfirmada = {
  estado: CodigoEstadoTDV.INTENCAO_COMPRA_CONFIRMADA
  codigoProvaVidaComprador: string
  tipoProvaVidaComprador: string
}

export type AtualizaTdvAutodeclaracaoResidenciaConfirmada = {
  estado: CodigoEstadoTDV.AUTODECLARACAO_RESIDENCIA_CONFIRMADA
  codigoProvaVidaComprador: string
  tipoProvaVidaComprador: string
  confirmacaoAutodeclaracaoResidenciaComprador: 'true'
}

export type AtualizaTdvAtpveAssinadaComprador = {
  estado: CodigoEstadoTDV.ATPVE_ASSINADA_COMPRADOR
  itiCode: string
}

// Origem 5 (Entrada Renave) only: the seller accepting the TCR is the transition that
// carries their facial liveness, since this journey has no informar-dados-venda /
// confirmar-intencao-venda step to carry it. Optional so the flow can stop sending it
// without an API change if ServiceNow ever rejects the pair on this transition.
export type AtualizaTdvTermoCienciaConfirmado = {
  estado: CodigoEstadoTDV.ATPVE_ASSINADA_COMPRADOR
  confirmacaoTermoCienciaResponsabilidade: true
}

export type AtualizaTdvAtpveAssinadaVendedor = {
  estado: CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA
  itiCode: string
}

export type AtualizaTdvTaxaServicoPaga = {
  estado: CodigoEstadoTDV.TAXA_SERVICO_PAGA
}

export type AtualizaTdvCancelada = {
  estado: CodigoEstadoTDV.TRANSFERENCIA_CANCELADA
  ativa: 'false'
}

export type AtualizaTdvEnderecoComprador = {
  cepComprador: string
  bairroComprador: string
  logradouroComprador: string
  numeroComprador: string
  complementoComprador: string
  estado?: CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA
}

export type AtualizaTdvCommand =
  | AtualizaTdvDadosVendaInformados
  | AtualizaTdvAtpveCriada
  | AtualizaTdvIntencaoCompraConfirmada
  | AtualizaTdvAutodeclaracaoResidenciaConfirmada
  | AtualizaTdvAtpveAssinadaComprador
  | AtualizaTdvTermoCienciaConfirmado
  | AtualizaTdvAtpveAssinadaVendedor
  | AtualizaTdvTaxaServicoPaga
  | AtualizaTdvCancelada
  | AtualizaTdvEnderecoComprador

export type AtualizaTdvResultSuccess = {
  result: {
    codigoTransferenciaVeiculo: string
  }
}

export type AtualizaTdvResult = AtualizaTdvResultSuccess
