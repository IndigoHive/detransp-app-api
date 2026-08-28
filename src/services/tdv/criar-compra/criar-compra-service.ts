import { BadRequest } from 'http-errors'
import type { Logger } from 'pino'
import { DetranSpServiceNowError } from '../../../clients/detran-sp-service-now'
import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import {
  CodigoEstadoTDV,
  type BuscaTdvResultData,
  type CodigoOrigemComunicacaoVendaVeiculo,
  type CodigoOrigemTDV,
  type CriaTdvCommand,
  type ListaTdvsResultData
} from '../../../clients/detran-sp-service-now/tdv/types'
import { firstName } from '../../../utils/first-name'
import { sanitizeEnderecoComplemento } from '../../../utils/sanitize-endereco-complemento'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'
import { NAO_INFORMADO } from '../comprador-display-fields'
import { mapPendenciaError, type PendenciaResult } from '../map-pendencia-error'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
  logger: Logger
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

// As telas de conclusão ([Comprador] Concluído e Pagamento confirmado) saúdam pelo primeiro
// nome — "Olá, Maria", não "Olá, MARIA DA SILVA". Elas leem este campo com fallback para o
// nomeComprador de /api/tdv/compras, que ConsultaComprasService já reduz do mesmo jeito; as
// duas pontas da mesma saudação precisam bater. "Não informado" passa intacto: é placeholder,
// não nome de gente.
function nomeParaSaudacao (valor: string | undefined): string | undefined {
  const nome = valor?.trim()
  if (!nome || nome === NAO_INFORMADO) return nome || undefined
  return firstName(nome) || undefined
}



function mapProximaAcao (
  estado: CodigoEstadoTDV | undefined,
  codigoTransferencia: string,
  data: BuscaTdvResultData | undefined,
  fallback: CriarCompraInput
): CriarCompraSuccessResult | Extract<CriarCompraResult, { showSnackbar: unknown }> {
  const vehicle = buildVehicle(data, fallback)
  const nomeComprador = nomeParaSaudacao(
    data?.nomeComprador?.trim() || fallback.nomeComprador?.trim()
  )

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

// O Detran confirmou que o app nativo erra neste ponto: quando o comprador edita o endereço,
// é o endereço editado que tem de ser gravado na TDV — não o que veio na comunicação de venda.
// Por isso os campos de endereço enviados pelo flow são sobrepostos ao registro ecoado em vez
// de descartados. É também o endereço que ele acabou de assinar na autodeclaração de
// residência, então gravar o da CV deixaria declaração e registro divergentes.
//
// Só sobrescreve o que chega preenchido. Quando o comprador não edita nada, o flow manda de
// volta os próprios valores da CV (`?? selectedVehicle.…`) e a sobreposição é inócua; e um
// campo ausente nunca apaga o que o registro já trazia.
function enderecoEditado (input: CriarCompraInput): Partial<ListaTdvsResultData> {
  const cepComprador = normalizeCep(input.cepComprador)
  const bairroComprador = input.bairroComprador?.trim()
  const logradouroComprador = input.logradouroComprador?.trim()
  const numeroComprador = input.numeroComprador?.trim()
  const complementoComprador = sanitizeEnderecoComplemento(input.complementoComprador ?? '')
  const nomeMunicipioComprador = input.nomeMunicipioComprador?.trim()

  return {
    ...(cepComprador ? { cepComprador } : {}),
    ...(bairroComprador ? { bairroComprador } : {}),
    ...(logradouroComprador ? { logradouroComprador } : {}),
    ...(numeroComprador ? { numeroComprador } : {}),
    ...(complementoComprador ? { complementoComprador } : {}),
    ...(nomeMunicipioComprador ? { nomeMunicipioComprador } : {})
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

function digitosSignificativos (value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '').replace(/^0+/, '')
}

// The plate is what identifies the vehicle here — the listing is already filtered by buyer,
// plate and ativa. The renavam only rules a row out when both sides carry a value, because
// ServiceNow can echo it back without the leading zeros it was stored with.
function mesmoVeiculo (
  tdv: ListaTdvsResultData,
  placaVeiculo: string,
  renavamVeiculo: string
): boolean {
  if ((tdv.placaVeiculo ?? '').trim().toUpperCase() !== placaVeiculo.trim().toUpperCase()) {
    return false
  }
  const renavamTdv = digitosSignificativos(tdv.codigoRenavamVeiculo)
  const renavamAlvo = digitosSignificativos(renavamVeiculo)
  return !renavamTdv || !renavamAlvo || renavamTdv === renavamAlvo
}

// The app in production serializes the record with Gson, which omits null fields and keeps empty
// strings — mirroring that keeps the payload equivalent to the one ServiceNow already accepts.
function semCamposNulos (registro: ListaTdvsResultData): ListaTdvsResultData {
  return Object.fromEntries(
    Object.entries(registro).filter(([, value]) => value != null)
  ) as ListaTdvsResultData
}

function isTdvAtivaExistenteError (error: unknown): boolean {
  return error instanceof DetranSpServiceNowError
    && error.type.toLowerCase() === TDV_ATIVA_EXISTENTE.toLowerCase()
}

export class CriarCompraService {
  private readonly client: DetranSpServiceNowTdvClient
  private readonly logger: Logger

  constructor ({ detranSpServiceNowTdv, logger }: Dependencies) {
    this.client = detranSpServiceNowTdv
    this.logger = logger
  }

  async run (authorizationHeader: string | undefined, input: CriarCompraInput): Promise<CriarCompraResult> {
    const token = extractBearerToken(authorizationHeader)
    const cpf = extractCpfFromToken(token)
    const auth = { token, cpf }

    const placaVeiculo = input.placaVeiculo?.trim() ?? ''
    const renavamVeiculo = input.renavamVeiculo?.trim() ?? ''
    const nomeVendedor = input.nomeVendedor?.trim() ?? ''
    const codigoVendedor = input.codigoVendedor?.trim() ?? ''
    // Never falls back to the token's e-mail: this runs on the buyer's session, so that
    // would file the buyer's address as the seller's. Omitted when unknown instead.
    const emailVendedor = input.emailVendedor?.trim() || undefined
    const origem = input.origem

    if (!placaVeiculo || !renavamVeiculo || !nomeVendedor || !codigoVendedor || !origem) {
      throw BadRequest('placaVeiculo, renavamVeiculo, origem, nomeVendedor e codigoVendedor são obrigatórios')
    }

    const prepared: CriarCompraInput = {
      ...input,
      placaVeiculo,
      renavamVeiculo
    }

    // ServiceNow expects the comunicação de venda echoed back whole: the app in production posts
    // the listed record as it came, marking only the residence confirmation. Re-reading it here
    // (instead of rebuilding it from what the flow sent) keeps every field — including the ones no
    // screen shows — and keeps values like the zero-padded CPF byte-identical. Falls back to the
    // assembled payload when the record can't be found.
    const registro = await this.findRegistroAtivo(auth, cpf, placaVeiculo, renavamVeiculo)
      .catch((error: unknown) => {
        // Swallowed on purpose — without the record we still create from what the flow sent —
        // but it has to be visible: a failed lookup here is what turns a retry into a duplicate.
        this.logger.warn(
          { placaVeiculo, err: error },
          'Falha ao reler a comunicação de venda antes de criar a TDV'
        )
        return undefined
      })

    // The TDV already exists: read it and route, never create again. This is what the app in
    // production does (ConfirmarEnderecoScreen.kt:700 only creates when the code is empty), and
    // it is what keeps this endpoint safe to re-enter — landing back on the address screen after
    // the TDV was created must not turn into an invalid-transition error.
    const codigoExistente = registro?.codigoTransferenciaVeiculo?.trim()
    if (codigoExistente) {
      return this.lerEmapear(auth, codigoExistente, prepared)
    }

    const criaTdvPayload: CriaTdvCommand = registro
      ? {
          ...semCamposNulos(registro),
          ...enderecoEditado(prepared),
          confirmacaoAutodeclaracaoResidenciaComprador: 'true' as const
        }
      : {
          ...pickOptionalListingFields(prepared),
          ...pickAddressFields(prepared),
          codigoRenavamVeiculo: renavamVeiculo,
          placaVeiculo,
          nomeVendedor,
          ...(emailVendedor ? { emailVendedor } : {}),
          codigoVendedor,
          origem,
          confirmacaoAutodeclaracaoResidenciaComprador: 'true' as const
        }

    let codigoTransferencia: string | undefined

    try {
      const createResult = await this.client.criaTdv(auth, criaTdvPayload)
      codigoTransferencia = createResult?.result?.codigoTransferenciaVeiculo
    } catch (error) {
      if (!isTdvAtivaExistenteError(error)) {
        const pendencia = mapPendenciaError(error)
        if (!pendencia) throw error
        return this.buildPendenciaResult(auth, cpf, prepared, pendencia)
      }
    }

    // ServiceNow answers the create with 201 and no body whenever the TDV was already there —
    // the same outcome as TDVAtivaExistenteError (spec, "Sem pendências"). Both land here, and the
    // code is read back: from the record when the CV already carried one, otherwise by relisting.
    // The record read before the create had no code (otherwise this would have returned already),
    // so the code can only come from a fresh listing — the buyer's first, then the vehicle's.
    if (!codigoTransferencia) {
      codigoTransferencia = await this.resolveExistingCodigo(auth, cpf, placaVeiculo, renavamVeiculo)
        || await this.resolveCodigoPorVeiculo(auth, cpf, placaVeiculo, renavamVeiculo)
    }

    // The TDV is there — ServiceNow either refused a second one or answered the create with no
    // body — but the listing never gave up its code. Nothing else can be done in this request,
    // so tell the buyer how to get back on track instead of dropping a 500 on them.
    if (!codigoTransferencia) {
      this.logger.error(
        { placaVeiculo, renavamVeiculo, origem },
        'TDV existe no ServiceNow mas não apareceu na listagem do comprador'
      )
      return {
        showSnackbar: {
          variant: 'error',
          title: 'Transferência já iniciada',
          description: 'A transferência deste veículo já foi criada, mas não conseguimos carregá-la agora. Volte para a lista de veículos e selecione-o novamente.'
        }
      }
    }

    return this.lerEmapear(auth, codigoTransferencia, prepared)
  }

  private async lerEmapear (
    auth: Auth,
    codigoTransferencia: string,
    input: CriarCompraInput
  ): Promise<CriarCompraResult> {
    const tdv = await this.client.buscaTdv(
      auth,
      codigoTransferencia,
      'placaVeiculo,descricaoMarcaVeiculo,descricaoCorVeiculo,nomeComprador,estado,codigoRenavamVeiculo'
    )
    return mapProximaAcao(tdv?.result?.estado, codigoTransferencia, tdv?.result, input)
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

    const nomeComprador = nomeParaSaudacao(input.nomeComprador)

    return {
      ...pendencia,
      ...(codigoTransferencia ? { codigoTransferencia } : {}),
      vehicle: buildVehicle(undefined, input),
      ...(nomeComprador ? { nomeComprador } : {})
    }
  }

  // Two deliberate choices in this query, both learned the hard way against homologação:
  // no `campos` (the create echoes this record back, so it has to come whole) and no
  // `placaVeiculo` (the same query /api/tdv/compras uses, which is known to return the buyer's
  // records — filtering by plate is done here, on a list that has a handful of rows).
  private async findRegistroAtivo (
    auth: Auth,
    cpf: string,
    placaVeiculo: string,
    renavamVeiculo: string
  ): Promise<ListaTdvsResultData | undefined> {
    const listed = await this.client.listaTdvs(auth, {
      ativa: 'true',
      codigoComprador: cpf
    })

    const candidatos = (listed?.result ?? [])
      .filter(tdv => mesmoVeiculo(tdv, placaVeiculo, renavamVeiculo))

    // A comunicação de venda and the TDV promoted from it can both be listed for a while; the
    // row carrying the code is the one worth having.
    return candidatos.find(tdv => tdv.codigoTransferenciaVeiculo?.trim()) ?? candidatos[0]
  }

  private async resolveExistingCodigo (
    auth: Auth,
    cpf: string,
    placaVeiculo: string,
    renavamVeiculo: string
  ): Promise<string | undefined> {
    const registro = await this.findRegistroAtivo(auth, cpf, placaVeiculo, renavamVeiculo)
      .catch((error: unknown) => {
        this.logger.warn(
          { placaVeiculo, err: error },
          'Falha ao listar TDVs do comprador para recuperar o código da transferência'
        )
        return undefined
      })

    return registro?.codigoTransferenciaVeiculo?.trim() || undefined
  }

  // TDVAtivaExistenteError is about the *vehicle*, not the buyer — and a TDV can be refused as
  // duplicate while the buyer's own listing still shows only the comunicação de venda. This is
  // the query the app in production uses on the seller side (getEncontrarTransfVeiculo), and it
  // is the one that surfaces the TDV that blocked the create.
  private async resolveCodigoPorVeiculo (
    auth: Auth,
    cpf: string,
    placaVeiculo: string,
    renavamVeiculo: string
  ): Promise<string | undefined> {
    const listed = await this.client.listaTdvs(auth, { ativa: 'true', placaVeiculo })
      .catch((error: unknown) => {
        this.logger.warn(
          { placaVeiculo, err: error },
          'Falha ao listar TDVs do veículo para recuperar o código da transferência'
        )
        return undefined
      })

    const registro = (listed?.result ?? [])
      .filter(tdv => mesmoVeiculo(tdv, placaVeiculo, renavamVeiculo))
      // Listing by plate is not scoped to the logged citizen, so the buyer has to be checked
      // here — handing back someone else's transfer would expose their data.
      .find(tdv =>
        digitosSignificativos(tdv.codigoComprador) === digitosSignificativos(cpf)
        && Boolean(tdv.codigoTransferenciaVeiculo?.trim())
      )

    return registro?.codigoTransferenciaVeiculo?.trim() || undefined
  }
}
