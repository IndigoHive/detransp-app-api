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

type ProcessDefinition = {
  type: VerificaVeiculoBody['tipo']
  subtype: VerificaVeiculoBody['subtipo']
  serviceName: string
}

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
  return PROCESS_LABELS.some((label) => label === value)
}

export function isOtherProcessLabel(value: string): boolean {
  return OTHER_PROCESS_LABELS.some((label) => label === value)
}

export class VerificaVeiculoVistoriaService {
  constructor (private readonly client: DetranSpServiceNowVistoriasClient) {}

  async run (input: VerificaVistoriaInput): Promise<VerificaVeiculoResponseData> {
    const definition = this.getProcessDefinition(input)
    let result: VerificaVeiculoResult
    try {
      result = await this.client.verificaVeiculo({
        placa: input.placa.toUpperCase(),
        renavam: input.renavam,
        tipo: definition.type,
        subtipo: definition.subtype,
      })
    } catch (error) {
      if (this.isInvalidVehicleResponse(error)) {
        return EMPTY_RESULT
      }
      throw error
    }
    const response = result?.result
    const correlationId = response?.correlationID

    if (!response?.success || !response.data.body.elegibilidade.podeVistoriar) {
      return this.withCorrelationId(EMPTY_RESULT, correlationId)
    }

    return this.mapResponse(
      response.data.body,
      definition,
      response.items[0]?.number,
      correlationId
    )
  }

  private getProcessDefinition (input: VerificaVistoriaInput): ProcessDefinition {
    const label = input.tipoProcesso === 'Outros' ? input.outroProcesso : input.tipoProcesso
    const definition = label ? PROCESS_DEFINITIONS[label as keyof typeof PROCESS_DEFINITIONS] : undefined

    if (!definition) {
      throw new Error('Unsupported inspection process')
    }

    return definition
  }

  private isInvalidVehicleResponse (error: unknown): boolean {
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
}
