import { BadRequest } from 'http-errors'
import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { CodigoEstadoTDV } from '../../../clients/detran-sp-service-now/tdv/types'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'
import { mapPendenciaError, type PendenciaResult } from '../map-pendencia-error'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

export type ConfirmarEnderecoInput = {
  codigoTransferencia?: string
  cepComprador?: string
  logradouroComprador?: string
  numeroComprador?: string
  complementoComprador?: string
  bairroComprador?: string
}

export type ConfirmarEnderecoSuccessResult = {
  enderecoComprador: string
  cepComprador: string
  logradouroComprador: string
  numeroComprador: string
  complementoComprador: string
  bairroComprador: string
  estado: CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA
}

export type ConfirmarEnderecoPendenciaResult = PendenciaResult

export type ConfirmarEnderecoResult = ConfirmarEnderecoSuccessResult | ConfirmarEnderecoPendenciaResult

function normalizeCep (cep: string | undefined): string | undefined {
  const digits = cep?.replace(/\D/g, '')
  return digits && digits.length === 8 ? digits : undefined
}

function hasFullAddress (input: ConfirmarEnderecoInput): boolean {
  return Boolean(
    normalizeCep(input.cepComprador)
    && input.logradouroComprador?.trim()
    && input.bairroComprador?.trim()
  )
}

function formatEndereco (fields: {
  logradouroComprador: string
  numeroComprador: string
  bairroComprador: string
  complementoComprador: string
  cepComprador: string
}): string {
  return [
    fields.logradouroComprador,
    fields.numeroComprador,
    fields.complementoComprador,
    fields.bairroComprador,
    fields.cepComprador
  ].filter(Boolean).join(', ')
}

export class ConfirmarEnderecoService {
  private readonly client: DetranSpServiceNowTdvClient

  constructor ({ detranSpServiceNowTdv }: Dependencies) {
    this.client = detranSpServiceNowTdv
  }

  async run (authorizationHeader: string | undefined, input: ConfirmarEnderecoInput): Promise<ConfirmarEnderecoResult> {
    const token = extractBearerToken(authorizationHeader)
    const cpf = extractCpfFromToken(token)
    const auth = { token, cpf }

    const addressFields = await this.resolveAddressFields(auth, input)
    const codigoTransferencia = input.codigoTransferencia?.trim() ?? ''

    if (codigoTransferencia) {
      try {
        await this.client.atualizaTdv(auth, codigoTransferencia, {
          ...addressFields,
          estado: CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA
        })
      } catch (error) {
        const pendencia = mapPendenciaError(error)
        if (!pendencia) throw error
        return {
          ...pendencia,
          codigoTransferencia
        }
      }
    }

    return {
      ...addressFields,
      enderecoComprador: formatEndereco(addressFields),
      estado: CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA
    }
  }

  private async resolveAddressFields (
    auth: { token: string, cpf: string },
    input: ConfirmarEnderecoInput
  ) {
    if (hasFullAddress(input)) {
      const cep = normalizeCep(input.cepComprador)!
      return {
        cepComprador: cep,
        bairroComprador: input.bairroComprador!.trim(),
        logradouroComprador: input.logradouroComprador!.trim(),
        numeroComprador: input.numeroComprador?.trim() ?? '',
        complementoComprador: input.complementoComprador?.trim() ?? ''
      }
    }

    const cep = normalizeCep(input.cepComprador)
    if (!cep) {
      throw BadRequest('cepComprador é obrigatório')
    }

    const enderecoResult = await this.client.buscaEndereco(auth, cep)
    const endereco = enderecoResult?.result

    return {
      cepComprador: cep,
      bairroComprador: endereco?.bairro ?? '',
      logradouroComprador: endereco?.logradouro ?? endereco?.endereco ?? '',
      numeroComprador: input.numeroComprador?.trim() ?? '',
      complementoComprador: input.complementoComprador?.trim() || endereco?.complemento || ''
    }
  }
}
