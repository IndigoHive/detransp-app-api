import { BadRequest } from 'http-errors'
import { DetranSpServiceNowError } from '../../../clients/detran-sp-service-now'
import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import {
  CodigoEstadoTDV,
  type BuscaTdvResultData,
  type CodigoOrigemComunicacaoVendaVeiculo,
  type CodigoOrigemTDV
} from '../../../clients/detran-sp-service-now/tdv/types'
import { extractBearerToken, extractCpfFromToken, extractEmailFromToken } from '../../../utils/token'
import { NAO_INFORMADO } from '../comprador-display-fields'
import { mapPendenciaError, type PendenciaResult } from '../map-pendencia-error'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
}

type Auth = { token: string, cpf: string }

export type CriarCompraInput = {
  placaVeiculo: string
  renavamVeiculo: string
  origem: CodigoOrigemTDV
  nomeVendedor: string
  codigoVendedor: string
  emailVendedor?: string
  cepComprador?: string
  logradouroComprador?: string
  bairroComprador?: string
  complementoComprador?: string
  ativa?: 'true' | 'false' | '1' | '0'
  estado?: CodigoEstadoTDV
  origemComunicacaoVendaVeiculo?: CodigoOrigemComunicacaoVendaVeiculo
  codigoTransferenciaVeiculo?: string
  descricaoMarcaVeiculo?: string
  codigoComprador?: string
  nomeComprador?: string
  nomeMunicipioVeiculo?: string
  nomeMunicipioComprador?: string
  chassiVeiculo?: string
  kmVeiculo?: string
  kmVistoriadaVeiculo?: string
  numeroComprador?: string
}

type VehicleSummary = {
  id: string
  plate: string
  title: string
  licensingStatus: string
  brandModel: string
  licensingExpirationDate: string
  renavam: string
  lastLicensing: string
  yearFab: string
  yearMod: string
}

export type CriarCompraSuccessResult = {
  proximaAcao: 'aviso_pagamento' | 'pagamento_confirmado' | 'concluido'
  estado: CodigoEstadoTDV
  codigoTransferencia: string
  vehicle: VehicleSummary
  nomeComprador?: string
}

export type CriarCompraPendenciaResult = PendenciaResult & {
  vehicle?: VehicleSummary
  nomeComprador?: string
}

export type CriarCompraResult = CriarCompraSuccessResult | CriarCompraPendenciaResult | {
  showSnackbar: {
    variant: string
    title: string
    description: string
  }
}

const TDV_ATIVA_EXISTENTE = 'TDVAtivaExistenteError'

function mapProximaAcao (
  estado: CodigoEstadoTDV | undefined,
  codigoTransferencia: string,
  data: BuscaTdvResultData | undefined,
  fallback: CriarCompraInput
): CriarCompraSuccessResult | Extract<CriarCompraResult, { showSnackbar: unknown }> {
  const vehicle = buildVehicle(data, fallback)
  const nomeComprador = data?.nomeComprador?.trim() || fallback.nomeComprador?.trim() || undefined

  if (estado === CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA) {
    return {
      proximaAcao: 'aviso_pagamento',
      estado,
      codigoTransferencia,
      vehicle,
      ...(nomeComprador ? { nomeComprador } : {})
    }
  }
  if (estado === CodigoEstadoTDV.TAXA_SERVICO_PAGA) {
    return {
      proximaAcao: 'pagamento_confirmado',
      estado,
      codigoTransferencia,
      vehicle,
      ...(nomeComprador ? { nomeComprador } : {})
    }
  }
  if (estado === CodigoEstadoTDV.TRANSFERENCIA_CONCLUIDA) {
    return {
      proximaAcao: 'concluido',
      estado,
      codigoTransferencia,
      vehicle,
      ...(nomeComprador ? { nomeComprador } : {})
    }
  }

  return {
    showSnackbar: {
      variant: 'error',
      title: 'Erro',
      description: 'Estado da transferência inválido para continuar'
    }
  }
}

function buildVehicle (data: BuscaTdvResultData | undefined, fallback: CriarCompraInput): VehicleSummary {
  const plate = data?.placaVeiculo ?? fallback.placaVeiculo
  const brandModel = data?.descricaoMarcaVeiculo ?? fallback.descricaoMarcaVeiculo ?? ''
  const renavam = data?.codigoRenavamVeiculo ?? fallback.renavamVeiculo

  return {
    id: '1',
    plate,
    title: brandModel,
    licensingStatus: 'REGULAR',
    brandModel,
    licensingExpirationDate: '',
    renavam,
    lastLicensing: '',
    yearFab: '',
    yearMod: ''
  }
}

function normalizeCep (cep: string | undefined): string | undefined {
  const digits = cep?.replace(/\D/g, '')
  return digits && digits.length === 8 ? digits : undefined
}

function normalizeAtiva (ativa: CriarCompraInput['ativa']): 'true' | 'false' | undefined {
  if (ativa === '1' || ativa === 'true') return 'true'
  if (ativa === '0' || ativa === 'false') return 'false'
  return undefined
}

function pickAddressFields (input: CriarCompraInput) {
  const cepComprador = normalizeCep(input.cepComprador)
  const bairroComprador = input.bairroComprador?.trim() ?? ''
  const logradouroComprador = input.logradouroComprador?.trim() ?? ''
  if (!cepComprador || !bairroComprador || !logradouroComprador) {
    throw BadRequest('cepComprador, bairroComprador e logradouroComprador são obrigatórios')
  }
  return {
    cepComprador,
    bairroComprador,
    logradouroComprador,
    numeroComprador: input.numeroComprador?.trim() ?? '',
    complementoComprador: input.complementoComprador?.trim() ?? ''
  }
}

function resolveKmVistoriada (input: {
  kmVistoriadaVeiculo?: string | null
  kmVeiculo?: string | null
}): string | undefined {
  const kmVistoriada = input.kmVistoriadaVeiculo?.trim()
  if (kmVistoriada) return kmVistoriada
  const kmVeiculo = input.kmVeiculo?.trim()
  return kmVeiculo || undefined
}

function digitsOnly (value: string | undefined): string | undefined {
  const digits = value?.replace(/\D/g, '')
  return digits || undefined
}

function omitNaoInformado (value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  if (!trimmed || trimmed === NAO_INFORMADO) return undefined
  return trimmed
}

function pickOptionalListingFields (input: CriarCompraInput) {
  const kmVistoriada = resolveKmVistoriada(input)
  const kmVeiculo = input.kmVeiculo?.trim()
  const ativa = normalizeAtiva(input.ativa)
  const codigoComprador = digitsOnly(input.codigoComprador)
  const nomeComprador = omitNaoInformado(input.nomeComprador)
  return {
    ...(ativa ? { ativa } : {}),
    ...(input.estado ? { estado: input.estado } : {}),
    ...(input.origemComunicacaoVendaVeiculo
      ? { origemComunicacaoVendaVeiculo: input.origemComunicacaoVendaVeiculo }
      : {}),
    ...(input.codigoTransferenciaVeiculo?.trim()
      ? { codigoTransferenciaVeiculo: input.codigoTransferenciaVeiculo.trim() }
      : {}),
    ...(input.descricaoMarcaVeiculo?.trim()
      ? { descricaoMarcaVeiculo: input.descricaoMarcaVeiculo.trim() }
      : {}),
    ...(codigoComprador ? { codigoComprador } : {}),
    ...(nomeComprador ? { nomeComprador } : {}),
    ...(input.nomeMunicipioVeiculo?.trim()
      ? { nomeMunicipioVeiculo: input.nomeMunicipioVeiculo.trim() }
      : {}),
    ...(input.nomeMunicipioComprador?.trim()
      ? { nomeMunicipioComprador: input.nomeMunicipioComprador.trim() }
      : {}),
    ...(input.chassiVeiculo?.trim() ? { chassiVeiculo: input.chassiVeiculo.trim() } : {}),
    ...(kmVeiculo ? { kmVeiculo } : {}),
    ...(kmVistoriada ? { kmVistoriadaVeiculo: kmVistoriada } : {}),
    ...(input.numeroComprador?.trim() ? { numeroComprador: input.numeroComprador.trim() } : {})
  }
}

function isTdvAtivaExistenteError (error: unknown): boolean {
  return error instanceof DetranSpServiceNowError
    && error.type.toLowerCase() === TDV_ATIVA_EXISTENTE.toLowerCase()
}

export class CriarCompraService {
  private readonly client: DetranSpServiceNowTdvClient

  constructor ({ detranSpServiceNowTdv }: Dependencies) {
    this.client = detranSpServiceNowTdv
  }

  async run (authorizationHeader: string | undefined, input: CriarCompraInput): Promise<CriarCompraResult> {
    const token = extractBearerToken(authorizationHeader)
    const cpf = extractCpfFromToken(token)
    const email = extractEmailFromToken(token)
    const auth = { token, cpf }

    const placaVeiculo = input.placaVeiculo?.trim() ?? ''
    const renavamVeiculo = input.renavamVeiculo?.trim() ?? ''
    const nomeVendedor = input.nomeVendedor?.trim() ?? ''
    const codigoVendedor = input.codigoVendedor?.trim() ?? ''
    const emailVendedor = input.emailVendedor?.trim() ?? email
    const origem = input.origem

    if (!placaVeiculo || !renavamVeiculo || !nomeVendedor || !codigoVendedor || !origem) {
      throw BadRequest('placaVeiculo, renavamVeiculo, origem, nomeVendedor e codigoVendedor são obrigatórios')
    }

    const prepared: CriarCompraInput = {
      ...input,
      placaVeiculo,
      renavamVeiculo
    }

    const addressFields = pickAddressFields(prepared)
    const optionalFields = pickOptionalListingFields(prepared)
    const criaTdvPayload = {
      ...optionalFields,
      ...addressFields,
      codigoRenavamVeiculo: renavamVeiculo,
      placaVeiculo,
      nomeVendedor,
      emailVendedor,
      codigoVendedor,
      origem,
      confirmacaoAutodeclaracaoResidenciaComprador: 'true' as const
    }

    let codigoTransferencia: string | undefined

    try {
      const createResult = await this.client.criaTdv(auth, criaTdvPayload)
      codigoTransferencia = createResult?.result?.codigoTransferenciaVeiculo
    } catch (error) {
      if (isTdvAtivaExistenteError(error)) {
        codigoTransferencia = await this.resolveExistingCodigo(auth, cpf, placaVeiculo, renavamVeiculo)
      } else {
        const pendencia = mapPendenciaError(error)
        if (!pendencia) throw error
        return this.buildPendenciaResult(auth, cpf, prepared, pendencia)
      }
    }

    if (!codigoTransferencia) {
      throw new Error('Falha ao criar transferência: codigoTransferencia não encontrado')
    }

    const tdv = await this.client.buscaTdv(
      auth,
      codigoTransferencia,
      'placaVeiculo,descricaoMarcaVeiculo,descricaoCorVeiculo,nomeComprador,estado,codigoRenavamVeiculo'
    )
    return mapProximaAcao(tdv?.result?.estado, codigoTransferencia, tdv?.result, prepared)
  }

  private async buildPendenciaResult (
    auth: Auth,
    cpf: string,
    input: CriarCompraInput,
    pendencia: PendenciaResult
  ): Promise<CriarCompraPendenciaResult> {
    let codigoTransferencia = input.codigoTransferenciaVeiculo?.trim() || undefined
    if (!codigoTransferencia) {
      try {
        codigoTransferencia = await this.resolveExistingCodigo(
          auth,
          cpf,
          input.placaVeiculo,
          input.renavamVeiculo
        )
      } catch {
        codigoTransferencia = undefined
      }
    }

    return {
      ...pendencia,
      ...(codigoTransferencia ? { codigoTransferencia } : {}),
      vehicle: buildVehicle(undefined, input),
      ...(input.nomeComprador?.trim() ? { nomeComprador: input.nomeComprador.trim() } : {})
    }
  }

  private async resolveExistingCodigo (
    auth: Auth,
    cpf: string,
    placaVeiculo: string,
    renavamVeiculo: string
  ): Promise<string | undefined> {
    const listed = await this.client.listaTdvs(auth, {
      ativa: 'true',
      codigoComprador: cpf,
      placaVeiculo
    })
    const match = listed?.result?.find((tdv) =>
      (tdv.placaVeiculo ?? '') === placaVeiculo
      && (tdv.codigoRenavamVeiculo ?? '') === renavamVeiculo
      && Boolean(tdv.codigoTransferenciaVeiculo?.trim())
    )
    return match?.codigoTransferenciaVeiculo?.trim()
  }
}
