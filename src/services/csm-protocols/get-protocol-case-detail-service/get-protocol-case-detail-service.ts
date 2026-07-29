import type { ServiceNowCsmClient } from '../../../clients'

export type GetProtocolCaseDetailResult = {
  result:  {
    sys_id: string
    number: string
    short_description: string
    opened_at: string
    public_resolution_code: string
    contact_type: string
    opened_by: {
      value: string
    },
    x_mdpdd_detran_csm_reopen_count: number,
    active: boolean
    state: number
    sys_updated_on: string
    form_nome: string
  }
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

    const sysparmFields = 'sys_id,number,state,active,short_description,opened_at,sys_updated_on,x_mdpdd_detran_csm_reopen_count,contact_type, public_resolution_code,opened_by,form_nome'


    const protocolDetails = await this.serviceNowCsm.getProtocolDetail<GetProtocolCaseDetailResult>(
      protocolId,
      { sysparm_fields: sysparmFields }
    )

    const openedBy = protocolDetails.result.opened_by
    const openedBySysId = openedBy.value

    const protocolOpenedyBy = await this.serviceNowCsm.getOpenedBy<{ result: { name: string} }>(
      openedBySysId,
      { sysparm_fields: 'name' }
    )

    return {
      result: {
        ...protocolDetails.result,
        opened_by: {
          value: protocolOpenedyBy.result.name
        }
      }
    }
  }
}
