import type { ListaTdvsResultData } from '../../clients/detran-sp-service-now/tdv/types'
import { formatCep, formatCpfCnpj } from '../../utils/format-document'

export type CompradorDisplayFields = {
  cpfComprador?: string
  nomeComprador?: string
  emailComprador?: string
  enderecoComprador?: string
  descricaoCorVeiculo?: string
  chassiVeiculo?: string
}

function trimField (value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}

function formatEnderecoComprador (tdv: ListaTdvsResultData): string | undefined {
  const logradouro = trimField(tdv.logradouroComprador)
  const numero = trimField(tdv.numeroComprador)
  const complemento = trimField(tdv.complementoComprador)
  const bairro = trimField(tdv.bairroComprador)
  const municipio = trimField(tdv.nomeMunicipioComprador)
  const uf = trimField(tdv.ufComprador)
  const cep = trimField(tdv.cepComprador)
  const cepFormatado = cep ? formatCep(cep) : undefined
  const municipioUf = municipio
    ? (uf ? `${municipio} - ${uf}` : municipio)
    : uf

  const endereco = [logradouro, numero, complemento, bairro, municipioUf, cepFormatado]
    .filter(Boolean)
    .join(', ')

  return endereco || undefined
}

export function chassiVeiculoFrom (
  tdv?: Pick<ListaTdvsResultData, 'chassiVeiculo'> | undefined,
  selectedVehicle?: { chassi?: unknown, chassiVeiculo?: unknown, [key: string]: unknown } | undefined
): string | undefined {
  const fromSelected = (value: unknown): string | undefined =>
    typeof value === 'string' ? trimField(value) : undefined

  return trimField(tdv?.chassiVeiculo)
    ?? fromSelected(selectedVehicle?.chassiVeiculo)
    ?? fromSelected(selectedVehicle?.chassi)
}

export function compradorDisplayFieldsFromTdv (tdv: ListaTdvsResultData): CompradorDisplayFields {
  const cpfCompradorRaw = trimField(tdv.codigoComprador)
  const cpfComprador = cpfCompradorRaw ? formatCpfCnpj(cpfCompradorRaw) : undefined
  const nomeComprador = trimField(tdv.nomeComprador)
  const emailComprador = trimField(tdv.emailComprador)
  const enderecoComprador = formatEnderecoComprador(tdv)
  const descricaoCorVeiculo = trimField(tdv.descricaoCorVeiculo)
  const chassiVeiculo = trimField(tdv.chassiVeiculo)

  return {
    ...(cpfComprador ? { cpfComprador } : {}),
    ...(nomeComprador ? { nomeComprador } : {}),
    ...(emailComprador ? { emailComprador } : {}),
    ...(enderecoComprador ? { enderecoComprador } : {}),
    ...(descricaoCorVeiculo ? { descricaoCorVeiculo } : {}),
    ...(chassiVeiculo ? { chassiVeiculo } : {})
  }
}
