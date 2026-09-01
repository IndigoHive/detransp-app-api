import type {
  DetranSpServiceNowVistoriasClient,
} from '../../../clients/detran-sp-service-now-vistorias'
import type {
  VerificaVeiculoBody,
  VerificaVeiculoResponseData,
  VerificaVeiculoResult,
  VerificaVeiculoServiceNowBody,
} from '../../../clients/detran-sp-service-now-vistorias/types'
import { DetranSpServiceNowVistoriasError } from '../../../clients/detran-sp-service-now-vistorias'
import { isHttpError } from 'http-errors'
import type { VerificaVistoriaInput } from '../types'
import type { IAnalyticsService } from '../../analytics'
import { stripHtml } from '../../../utils/strip-html'

type ProcessDefinition = {
  type: VerificaVeiculoBody['tipo']
  subtype: VerificaVeiculoBody['subtipo']
  serviceName: string
}

type VerificaVeiculoVistoriaOutput =
  | VerificaVeiculoResponseData
  | (VerificaVeiculoResponseData & {
    showSnackbar: {
      variant: 'error'
      title: string
      description: string
    }
  })

const PROCESS_DEFINITIONS = {
  'Classificação de Monta': {
    type: 'ESTRUTURA',
    subtype: 'ESTRUTURA_1',
    serviceName: 'Vistoria de Estrutura e Alteração Veicular',
  },
  'Compra e Venda de Veículo': {
    type: 'SEGURANCA',
    subtype: 'SEGURANCA_1',
    serviceName: 'Vistoria de Segurança Veicular',
  },
  'Consolidação da propriedade': {
    type: 'IDENTIFICACAO',
    subtype: 'IDENTIFICACAO_3',
    serviceName: 'Vistoria de Identificação Veicular',
  },
  'Correção de Dados': {
    type: 'SEGURANCA',
    subtype: 'SEGURANCA_8',
    serviceName: 'Vistoria de Segurança Veicular',
  },
  'Liberação de Veículo': {
    type: 'SEGURANCA',
    subtype: 'SEGURANCA_4',
    serviceName: 'Vistoria de Segurança Veicular',
  },
  'Mera Identificação': {
    type: 'IDENTIFICACAO',
    subtype: 'IDENTIFICACAO_1',
    serviceName: 'Vistoria de Identificação Veicular',
  },
  'Transferência de Localidade': {
    type: 'SEGURANCA',
    subtype: 'SEGURANCA_2',
    serviceName: 'Vistoria de Segurança Veicular',
  },
  SEGURANCA_9: {
    type: 'SEGURANCA',
    subtype: 'SEGURANCA_9',
    serviceName: 'Vistoria de Segurança Veicular',
  },
} as const satisfies Record<string, ProcessDefinition>

const PROCESS_LABELS = [
  'Compra e Venda de Veículo',
  'Mera Identificação',
  'Classificação de Monta',
  'Outros',
] as const

const OTHER_PROCESS_LABELS = [
  'Consolidação da propriedade',
  'Transferência de Localidade',
  'Liberação de Veículo',
  'Correção de Dados',
] as const

const EMPTY_RESULT: VerificaVeiculoResponseData = {
  vehicle: null,
  service: null,
  totalDebits: null,
  numeroPEV: null,
}

const amountFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function isProcessLabel(value: string): boolean {
  const normalized = stripHtml(value)
  return PROCESS_LABELS.some((label) => label === normalized)
}

export function isOtherProcessLabel(value: string): boolean {
  const normalized = stripHtml(value)
  return OTHER_PROCESS_LABELS.some((label) => label === normalized)
}

export class VerificaVeiculoVistoriaService {
  constructor (
    private readonly client: DetranSpServiceNowVistoriasClient,
    private readonly analyticsService: IAnalyticsService
  ) {}

  async run (input: VerificaVistoriaInput): Promise<VerificaVeiculoVistoriaOutput> {
    const definition = this.getProcessDefinition(input)
    let result: VerificaVeiculoResult
    try {
      result = await this.client.verificaVeiculo(
        { token: input.token, cpf: input.cpf },
        {
          placa: input.placa.toUpperCase(),
          renavam: input.renavam,
          tipo: definition.type,
          subtipo: definition.subtype,
        }
      )
    } catch (error) {
      if (this.isInvalidVehicleResponse(error)) {
        return this.failure(error.message)
      }
      throw error
    }
    const response = result?.result
    const correlationId = response?.correlationID

    if (!response?.success) {
      return this.failure(response?.message, correlationId)
    }

    if (!response.data.body.elegibilidade.podeVistoriar) {
      return this.failure(response.data.body.elegibilidade.motivo || response.message, correlationId)
    }

    // Só aqui: os três `this.failure(...)` acima são veículo inelegível ou erro, não entrada no funil.
    this.analyticsService.capture(input.cpf, 'vistorias:vehicle_check')

    return this.mapResponse(
      response.data.body,
      definition,
      response.items[0]?.number,
      correlationId
    )
  }

  private getProcessDefinition (input: VerificaVistoriaInput): ProcessDefinition {
    const tipoProcesso = stripHtml(input.tipoProcesso)
    const outroProcesso = input.outroProcesso ? stripHtml(input.outroProcesso) : input.outroProcesso
    const label = tipoProcesso === 'Outros' || tipoProcesso === 'SEGURANCA' ? outroProcesso : tipoProcesso
    const definition = label ? PROCESS_DEFINITIONS[label as keyof typeof PROCESS_DEFINITIONS] : undefined

    if (!definition) {
      throw new Error('Unsupported inspection process')
    }

    return definition
  }

  private isInvalidVehicleResponse (
    error: unknown,
  ): error is DetranSpServiceNowVistoriasError & { statusCode: number } {
    if (!(error instanceof DetranSpServiceNowVistoriasError) || !isHttpError(error)) {
      return false
    }

    return error.statusCode === 400 || error.statusCode === 404 || error.statusCode === 422
  }

  private mapResponse (
    body: VerificaVeiculoServiceNowBody,
    definition: ProcessDefinition,
    numeroPEV: string | undefined,
    correlationId: string | undefined,
  ): VerificaVeiculoResponseData {
    const amount = amountFormatter.format(body.tarifa.valor)

    return {
      vehicle: {
        id: body.uuid,
        title: body.veiculo.marcaModelo,
        plate: body.veiculo.placa,
        brandModel: body.veiculo.marcaModelo,
        renavam: body.veiculo.renavam,
      },
      service: {
        name: definition.serviceName,
        description: `Serviço de ${definition.serviceName} (conforme Portaria Normativa nº 47 do Detran-SP).`,
        amount,
      },
      totalDebits: amount,
      numeroPEV: numeroPEV ?? null,
      ...(correlationId ? { correlationId } : {}),
    }
  }

  private withCorrelationId (
    result: VerificaVeiculoResponseData,
    correlationId: string | undefined,
  ): VerificaVeiculoResponseData {
    return correlationId ? { ...result, correlationId } : result
  }

  private failure (
    description?: string,
    correlationId?: string,
  ): VerificaVeiculoVistoriaOutput {
    return {
      ...this.withCorrelationId(EMPTY_RESULT, correlationId),
      showSnackbar: {
        variant: 'error',
        title: 'Não foi possível verificar o veículo',
        description: description ?? 'Tente novamente em alguns instantes.',
      },
    }
  }
}
