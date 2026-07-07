import type { ServiceNowCsmClient } from '../../../clients'
import { BadRequest } from 'http-errors'
import type { Logger } from 'pino'
import type {
  FinalizeProtocolInput,
  FinalizeProtocolResponse,
} from './types'

type Dependencies = {
  serviceNowCsm: ServiceNowCsmClient
  logger: Logger
}

export class FinalizeProtocolService {
  private readonly serviceNowCsm: ServiceNowCsmClient
  private readonly logger: Logger

  constructor ({ serviceNowCsm, logger }: Dependencies) {
    this.serviceNowCsm = serviceNowCsm
    this.logger = logger
  }

  async run (rawInput: FinalizeProtocolInput): Promise<FinalizeProtocolResponse> {
    try {
      const sysId = typeof rawInput.sys_id === 'string' ? rawInput.sys_id : ''

      if (!sysId.trim()) {
        throw new BadRequest('sys_id é obrigatório para finalizar o protocolo')
      }

      await this.serviceNowCsm.finalizeProtocol(sysId)

      return { success: true }
    } catch (error) {
      this.logger.error('Erro ao finalizar protocolo no ServiceNow CSM:')
      return {
        showSnackbar: {
          variant: 'error',
          title: 'Não foi possível finalizar a solicitação',
          description: this.getErrorDescription(error)
        },
      }
    }
  }

  private getErrorDescription (error: unknown): string {
    if (error instanceof Error) {
      const axiosError = error as any
      if (axiosError.response?.data?.error?.message) {
        return axiosError.response.data.error.message
      }
      return error.message
    }
    return 'Operação inválida'
  }
}
