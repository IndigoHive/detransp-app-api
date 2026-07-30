import type { ServiceNowCsmClient } from '../../../clients'

export type ServiceCaseItem = {
  sys_id: string
  number?: string
  state?: string
  short_description?: string
  opened_at?: string
  sys_updated_on?: string
  x_mdpdd_detran_csm_reopen_count?: string
  contact_type?: string
}

export type ListServiceCasesResult = {
  result: ServiceCaseItem[]
}

type Dependencies = {
  serviceNowCsm: ServiceNowCsmClient
}

export class ListServiceCasesService {
  private readonly serviceNowCsm: ServiceNowCsmClient

  constructor ({ serviceNowCsm}: Dependencies) {
    this.serviceNowCsm = serviceNowCsm
  }

  async run (cpf: string): Promise<ListServiceCasesResult> {
    if (!cpf) {
      return { result: [] }
    }

    const sysparmQuery = `opened_by.user_name=${cpf}^ORinternal_user.user_name=${cpf}^ORDERBYDESCsys_updated_on`
    const sysparmFields = 'sys_id,number,state,active,short_description,opened_at,sys_updated_on,x_mdpdd_detran_csm_reopen_count,contact_type, public_resolution_code'

    return await this.serviceNowCsm.getProtocols<ListServiceCasesResult>({
      sysparm_query: sysparmQuery,
      sysparm_fields: sysparmFields,
      sysparm_limit: 5,
      sysparm_order_by_desc: 'sys_updated_on'
    })
  }
}
