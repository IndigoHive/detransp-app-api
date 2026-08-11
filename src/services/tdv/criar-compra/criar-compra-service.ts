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

const STUB_ENRICH_CAMPOS = [
  'placaVeiculo',
  'codigoRenavamVeiculo',
  'chassiVeiculo',
  'kmVeiculo',
  'kmVistoriadaVeiculo',
  'cepComprador',
  'logradouroComprador',
  'bairroComprador',
  'numeroComprador',
  'complementoComprador',
  'codigoTransferenciaVeiculo'
].join(',')

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

function hasFullAddress (input: {
  cepComprador?: string
  logradouroComprador?: string
  bairroComprador?: string
}): boolean {
  return Boolean(
    normalizeCep(input.cepComprador)
    && input.logradouroComprador?.trim()
    && input.bairroComprador?.trim()
  )
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

function pickOptionalListingFields (input: CriarCompraInput) {
  const kmVistoriada = resolveKmVistoriada(input)
  const kmVeiculo = input.kmVeiculo?.trim()
  const ativa = normalizeAtiva(input.ativa)
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
    ...(input.codigoComprador?.trim() ? { codigoComprador: input.codigoComprador.trim() } : {}),
    ...(input.nomeComprador?.trim() ? { nomeComprador: input.nomeComprador.trim() } : {}),
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

    const enriched = await this.enrichFromStub(auth, cpf, {
      ...input,
      placaVeiculo,
      renavamVeiculo
    })

    const addressFields = await this.resolveAddressFields(auth, enriched)
    if (!hasFullAddress(addressFields)) {
      throw BadRequest('cepComprador, bairroComprador e logradouroComprador são obrigatórios')
    }

    const optionalFields = pickOptionalListingFields(enriched)
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
        return this.buildPendenciaResult(auth, cpf, enriched, pendencia)
      }
    }

    if (!codigoTransferencia) {
      throw new Error('Falha ao criar transferência')
    }

    const tdv = await this.client.buscaTdv(
      auth,
      codigoTransferencia,
      'placaVeiculo,descricaoMarcaVeiculo,descricaoCorVeiculo,nomeComprador,estado,codigoRenavamVeiculo'
    )
    return mapProximaAcao(tdv?.result?.estado, codigoTransferencia, tdv?.result, enriched)
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

  private async enrichFromStub (
    auth: Auth,
    cpf: string,
    input: CriarCompraInput
  ): Promise<CriarCompraInput> {
    const needsChassi = !input.chassiVeiculo?.trim()
    const needsKmVistoriada = !resolveKmVistoriada(input)
    const needsKmVeiculo = !input.kmVeiculo?.trim()
    const needsCep = !normalizeCep(input.cepComprador)
    const needsLogradouro = !input.logradouroComprador?.trim()
    const needsBairro = !input.bairroComprador?.trim()
    const needsNumero = !input.numeroComprador?.trim()
    const needsComplemento = !input.complementoComprador?.trim()
    const needsCodigoTransferencia = !input.codigoTransferenciaVeiculo?.trim()
    if (
      !needsChassi
      && !needsKmVistoriada
      && !needsKmVeiculo
      && !needsCep
      && !needsLogradouro
      && !needsBairro
      && !needsNumero
      && !needsComplemento
      && !needsCodigoTransferencia
    ) {
      return input
    }

    const listed = await this.client.listaTdvs(auth, {
      ativa: 'true',
      codigoComprador: cpf,
      campos: STUB_ENRICH_CAMPOS
    }).catch(() => undefined)
    const stub = listed?.result?.find((tdv) =>
      (tdv.placaVeiculo ?? '') === input.placaVeiculo
      && (tdv.codigoRenavamVeiculo ?? '') === input.renavamVeiculo
    )

    if (!stub) return input

    const stubKmVistoriada = resolveKmVistoriada(stub)

    return {
      ...input,
      ...(needsChassi && stub.chassiVeiculo?.trim()
        ? { chassiVeiculo: stub.chassiVeiculo.trim() }
        : {}),
      ...(needsKmVeiculo && stub.kmVeiculo?.trim()
        ? { kmVeiculo: stub.kmVeiculo.trim() }
        : {}),
      ...(needsKmVistoriada && stubKmVistoriada
        ? { kmVistoriadaVeiculo: stubKmVistoriada }
        : {}),
      ...(needsCep && normalizeCep(stub.cepComprador ?? undefined)
        ? { cepComprador: normalizeCep(stub.cepComprador ?? undefined) }
        : {}),
      ...(needsLogradouro && stub.logradouroComprador?.trim()
        ? { logradouroComprador: stub.logradouroComprador.trim() }
        : {}),
      ...(needsBairro && stub.bairroComprador?.trim()
        ? { bairroComprador: stub.bairroComprador.trim() }
        : {}),
      ...(needsNumero && stub.numeroComprador?.trim()
        ? { numeroComprador: stub.numeroComprador.trim() }
        : {}),
      ...(needsComplemento && stub.complementoComprador?.trim()
        ? { complementoComprador: stub.complementoComprador.trim() }
        : {}),
      ...(needsCodigoTransferencia && stub.codigoTransferenciaVeiculo?.trim()
        ? { codigoTransferenciaVeiculo: stub.codigoTransferenciaVeiculo.trim() }
        : {})
    }
  }

  private async resolveAddressFields (auth: Auth, input: CriarCompraInput) {
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
      return {
        ...(input.numeroComprador?.trim() ? { numeroComprador: input.numeroComprador.trim() } : {}),
        ...(input.complementoComprador?.trim()
          ? { complementoComprador: input.complementoComprador.trim() }
          : {})
      }
    }

    const enderecoResult = await this.client.buscaEndereco(auth, cep)
    const endereco = enderecoResult?.result

    return {
      cepComprador: cep,
      bairroComprador: input.bairroComprador?.trim() || endereco?.bairro || '',
      logradouroComprador: input.logradouroComprador?.trim()
        || endereco?.logradouro
        || endereco?.endereco
        || '',
      numeroComprador: input.numeroComprador?.trim() ?? '',
      complementoComprador: input.complementoComprador?.trim() || endereco?.complemento || ''
    }
  }
}
