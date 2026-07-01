import type { CodigoDescricao, DateString, Placa, Renavam } from './_common'

export type VeiculoAttributes = {
  placa: Placa
  idProprietario?: string
  nomeProprietario?: string
  chassi?: string
  renavam: Renavam
  espelho?: string
  codigoMunicipio?: number
  nomeMunicipio?: string
  uf?: string
  marcaModelo?: CodigoDescricao
  categoria?: CodigoDescricao
  tipo?: CodigoDescricao
  carroceria?: CodigoDescricao
  cor?: CodigoDescricao
  combustivel?: CodigoDescricao
  especie?: CodigoDescricao
  anoFabricacao?: number
  anoModelo?: number
  anoExercicioLicenciamento?: number
  dataEmissaoCRV?: DateString
  dataEmissaoLicenciamento?: DateString
}

export type VeiculoMeta = {
  bloqueioFurtoRoubo?: string
  restricaoTributaria?: string
  restricaoAdministrativa?: string
  restricaoJudicial?: string
  restricaoVeiculoGuinchado?: string
  multas?: string
  nomeAgente?: string | null
  valorDebitosLicenciamento?: number | null
  valorDebitosIPVA?: number | null
  valorDebitosMILT?: number | null
  valorDebitosRenainf?: number | null
  valorDebitos?: number | null
}

export type VeiculoResource = {
  id: string
  type: string
  attributes: VeiculoAttributes
  meta?: VeiculoMeta
}

export type ListaVeiculosResponse = {
  data: VeiculoResource[]
  meta?: { qtde: number }
}

export type ListaVeiculosResult = ListaVeiculosResponse | null | undefined

export type DebitoIncludedType =
  | 'debitos-ipva'
  | 'debitos-licenciamento'
  | 'debitos-milt'
  | 'debitos-renainf'

export type OrgaoAutuador = {
  codigo?: number
  nome?: string
}

export type DebitoIncludedAttributes = {
  exercicio?: number
  nomeServico?: string
  tipoServico?: number
  valor: number
  vencimento?: DateString
  dataVencimento?: DateString
  autoInfracao?: string
  dataInfracao?: DateString
  codigoOrgaoAutuador?: number
  nomeOrgaoAutuador?: string
  orgaoAutuador?: OrgaoAutuador
  descricao?: string
  dataHora?: string
  local?: string
  municipio?: string
}

export type DebitoIncluded = {
  type: DebitoIncludedType
  id: string
  attributes: DebitoIncludedAttributes
}

export type BuscaVeiculoResponse = {
  data: VeiculoResource
  meta?: VeiculoMeta
  included?: DebitoIncluded[]
}

export type BuscaVeiculoResult = BuscaVeiculoResponse | null | undefined
