import type { Logger } from 'pino'
import type { ServiceNowCsmClient } from '../../../clients'

export type GetServiceCaseDetailResult = {
  result: Record<string, unknown>
}

type Dependencies = {
  serviceNowCsm: ServiceNowCsmClient
  logger: Logger
}

export class GetServiceCaseDetailService {
  private readonly serviceNowCsm: ServiceNowCsmClient
  private readonly logger: Logger

  constructor ({ serviceNowCsm, logger }: Dependencies) {
    this.serviceNowCsm = serviceNowCsm
    this.logger = logger
  }

  async run (protocolId: string): Promise<GetServiceCaseDetailResult> {
    try {
      if (!protocolId.trim()) {
        const error = new Error('sys_id é obrigatório para buscar o detalhe do protocolo')
        ;(error as Error & { status?: number }).status = 400
        throw error
      }

      const sysparmFields = 'sys_id,number,state,active,short_description,opened_at,sys_updated_on,x_mdpdd_detran_csm_reopen_count,contact_type'

      return await this.serviceNowCsm.getProtocolDetail<GetServiceCaseDetailResult>(
        protocolId,
        { sysparm_fields: sysparmFields }
      )
    } catch (error) {
      this.logger.error(
        {
          err: error,
          protocolId,
          service: 'get-service-case-detail'
        },
        'Failed to fetch service protocol detail'
      )

      throw error
    }
  }
}
