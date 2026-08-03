export const enum CodigoEstadoTDV {
  VEICULO_SELECIONADO = '1',
  DADOS_VENDA_INFORMADOS = '2',
  ATPVE_CRIADA = '3',
  INTENCAO_COMPRA_CONFIRMADA = '4',
  AUTODECLARACAO_RESIDENCIA_CONFIRMADA = '5',
  ATPVE_ASSINADA_COMPRADOR = '6',
  ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA = '7',
  TAXA_SERVICO_PAGA = '8',
  TRANSFERENCIA_CONCLUIDA = '9',
  TRANSFERENCIA_CANCELADA = '10'
}

export const enum CodigoOrigemTDV {
  TDV = '1',
  E_NOTARIADO = '2',
  CDT = '3',
  RENAVE = '4'
}

export const enum CodigoOrigemComunicacaoVendaVeiculo {
  GEVER_ECRV = '1',
  PORTAL = '2',
  DETRAN = '3',
  CARTORIO = '4',
  SEFAZ = '5',
  ARQUIVO_GRAVAMES = '6',
  LEILAO = '7',
  VENDA_DIGITAL = '8',
  E_NOTARIADO = '9'
}

export const enum CodigoEstadoQRCode {
  ATIVO = '1',
  PAGO = '2',
  EXPIRADO = '3'
}
