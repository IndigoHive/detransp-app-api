export type TipoServicoAttributes = {
  // shape as of 2026-07-06
  name?: string | null
  codigo_sefaz?: string | null
  // legacy shape (pre 2026-07) — keep both, ServiceNow has drifted between them
  codigoservico?: string | null
  descricao?: string | null
}

export type TipoServicoResource = {
  type: string
  id: string
  attributes?: TipoServicoAttributes
}

export type ListaTiposServicoResponse = {
  data?: TipoServicoResource[]
}

export type ListaTiposServicoResult = ListaTiposServicoResponse | null | undefined

// codigo_sefaz values observed in homolog (stable business codes, unlike the env-specific sys_id UUIDs)
export const enum CodigoSefaz {
  TransferenciaVeiculo = '1',
  Licenciamento = '2',
  SegundaViaTransferencia = '5',
  PrimeiroRegistro = '6',
  DebitosPendentes = '7',
  IPVA = '8',
  Milt = '10',
  Renainf = '11',
  TaxasDetran = '12'
}
