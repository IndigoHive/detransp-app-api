import { BadRequest } from 'http-errors'
import { DetranSpServiceNowError } from '../../../clients/detran-sp-service-now'
import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import type { ListaTdvsResultData } from '../../../clients/detran-sp-service-now/tdv/types'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'
import type { IAnalyticsService } from '../../analytics'

type Dependencies = {
  detranSpServiceNowTdv: DetranSpServiceNowTdvClient
  analyticsService: IAnalyticsService
}

export type ValidarTdvInput = ListaTdvsResultData & {
  codigoTransferencia?: string
  renavamVeiculo?: string
}

export type ValidarTdvProximaAcao = 'enotariado' | 'duas_assinaturas' | 'duas_pessoas_fisicas'

export type ValidarTdvResult = {
  proximaAcao: ValidarTdvProximaAcao
}

const PROXIMA_ACAO_BY_TYPE: Record<string, Exclude<ValidarTdvProximaAcao, 'enotariado'>> = {
  duasassinaturaserror: 'duas_assinaturas',
  duaspessoasfisicaserror: 'duas_pessoas_fisicas'
}

function trimField (value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}

function digitsOnly (value: string | null | undefined): string | undefined {
  const digits = value?.replace(/\D/g, '')
  return digits || undefined
}

function asServiceNowError (error: unknown): DetranSpServiceNowError | undefined {
  if (error instanceof DetranSpServiceNowError) return error
  if (
    error
    && typeof error === 'object'
    && 'cause' in error
    && (error as { cause: unknown }).cause instanceof DetranSpServiceNowError
  ) {
    return (error as { cause: DetranSpServiceNowError }).cause
  }
  return undefined
}

function mapValidarTdvError (error: unknown): ValidarTdvResult | undefined {
  const snError = asServiceNowError(error)
  if (!snError) return undefined

  const proximaAcao = PROXIMA_ACAO_BY_TYPE[snError.type.toLowerCase()]
  if (!proximaAcao) return undefined

  return { proximaAcao }
}

function toCommand (input: ValidarTdvInput): ListaTdvsResultData {
  const { codigoTransferencia, renavamVeiculo, ...rest } = input
  const codigoTransferenciaVeiculo = trimField(input.codigoTransferenciaVeiculo)
    ?? trimField(codigoTransferencia)
  const placaVeiculo = trimField(input.placaVeiculo)
  const codigoRenavamVeiculo = trimField(input.codigoRenavamVeiculo)
    ?? trimField(renavamVeiculo)
  const codigoComprador = digitsOnly(input.codigoComprador)

  return {
    ...rest,
    ...(codigoTransferenciaVeiculo ? { codigoTransferenciaVeiculo } : {}),
    ...(placaVeiculo ? { placaVeiculo } : {}),
    ...(codigoRenavamVeiculo ? { codigoRenavamVeiculo } : {}),
    ...(codigoComprador ? { codigoComprador } : {}),
    ...(input.origem ? { origem: input.origem } : {}),
    ...(input.estado ? { estado: input.estado } : {})
  }
}

export class ValidarTdvService {
  private readonly client: DetranSpServiceNowTdvClient
  private readonly analyticsService: IAnalyticsService

  constructor ({ detranSpServiceNowTdv, analyticsService }: Dependencies) {
    this.client = detranSpServiceNowTdv
    this.analyticsService = analyticsService
  }

  async run (
    authorizationHeader: string | undefined,
    input: ValidarTdvInput
  ): Promise<ValidarTdvResult> {
    const command = toCommand(input)
    const placaVeiculo = command.placaVeiculo
    const codigoRenavamVeiculo = command.codigoRenavamVeiculo
    const origem = command.origem
    const estado = command.estado

    // `estado` is deliberately not required: a comunicação de venda registered outside the
    // app (TDV 6.0) is validated before any TDV exists for it, so it legitimately arrives
    // without one. It is still forwarded whenever present.
    if (!placaVeiculo || !codigoRenavamVeiculo || !origem) {
      throw BadRequest(
        'placaVeiculo, codigoRenavamVeiculo e origem são obrigatórios'
      )
    }

    const token = extractBearerToken(authorizationHeader)
    const cpf = extractCpfFromToken(token)
    const auth = { token, cpf }

    try {
      await this.client.validarTdv(auth, {
        ...command,
        placaVeiculo,
        codigoRenavamVeiculo,
        origem,
        ...(estado ? { estado } : {})
      })
      return this.captureResult(cpf, { proximaAcao: 'enotariado' })
    } catch (error) {
      const mapped = mapValidarTdvError(error)
      if (!mapped) throw error
      return this.captureResult(cpf, mapped)
    }
  }

  // Consulta, não mutação: repetição é sinal legítimo, então sem $insert_id. A proximaAcao
  // é o valor do evento — mostra a frequência de cada ramo de validação.
  private captureResult (cpf: string, result: ValidarTdvResult): ValidarTdvResult {
    this.analyticsService.capture(cpf, 'tdv:validate', { proxima_acao: result.proximaAcao })
    return result
  }
}
