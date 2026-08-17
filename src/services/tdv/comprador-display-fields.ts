import type { ListaTdvsResultData } from '../../clients/detran-sp-service-now/tdv/types'

export type CompradorDisplayFields = {
  cpfComprador?: string
  nomeComprador?: string
  emailComprador?: string
  enderecoComprador?: string
  descricaoCorVeiculo?: string
}

function trimField (value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}

export function formatEnderecoComprador (tdv: ListaTdvsResultData): string | undefined {
  const logradouro = trimField(tdv.logradouroComprador)
  const numero = trimField(tdv.numeroComprador)
  const complemento = trimField(tdv.complementoComprador)
  const bairro = trimField(tdv.bairroComprador)
  const municipio = trimField(tdv.nomeMunicipioComprador)
  const uf = trimField(tdv.ufComprador)
  const cep = trimField(tdv.cepComprador)
  const municipioUf = municipio
    ? (uf ? `${municipio} - ${uf}` : municipio)
    : uf

  const endereco = [logradouro, numero, complemento, bairro, municipioUf, cep]
    .filter(Boolean)
    .join(', ')

  return endereco || undefined
}

export function compradorDisplayFieldsFromTdv (tdv: ListaTdvsResultData): CompradorDisplayFields {
  const cpfComprador = trimField(tdv.codigoComprador)
  const nomeComprador = trimField(tdv.nomeComprador)
  const emailComprador = trimField(tdv.emailComprador)
  const enderecoComprador = formatEnderecoComprador(tdv)
  const descricaoCorVeiculo = trimField(tdv.descricaoCorVeiculo)

  return {
    ...(cpfComprador ? { cpfComprador } : {}),
    ...(nomeComprador ? { nomeComprador } : {}),
    ...(emailComprador ? { emailComprador } : {}),
    ...(enderecoComprador ? { enderecoComprador } : {}),
    ...(descricaoCorVeiculo ? { descricaoCorVeiculo } : {})
  }
}
