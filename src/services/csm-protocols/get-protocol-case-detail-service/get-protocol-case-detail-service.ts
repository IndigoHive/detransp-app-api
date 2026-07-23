import type { ServiceNowCsmClient } from '../../../clients'

export type GetProtocolCaseDetailResult = {
  result: Record<string, unknown>
}

type Dependencies = {
  serviceNowCsm: ServiceNowCsmClient
}

export class GetProtocolCaseDetailService {
  private readonly serviceNowCsm: ServiceNowCsmClient

  constructor ({ serviceNowCsm }: Dependencies) {
    this.serviceNowCsm = serviceNowCsm
  }

  async run (protocolId: string): Promise<GetProtocolCaseDetailResult> {
    if (!protocolId.trim()) {
      const error = new Error('sys_id é obrigatório para buscar o detalhe do protocolo')
      ;(error as Error & { status?: number }).status = 400
      throw error
    }

    const sysparmFields = 'sys_id,number,state,active,short_description,opened_at,sys_updated_on,x_mdpdd_detran_csm_reopen_count,contact_type, public_resolution_code'

    return await this.serviceNowCsm.getProtocolDetail<GetProtocolCaseDetailResult>(
      protocolId,
      { sysparm_fields: sysparmFields }
    )
  }
}
