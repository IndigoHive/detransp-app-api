import type { ServiceNowCsmClient } from '../../../clients'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'

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

  async run (authorizationHeader: string | undefined): Promise<ListServiceCasesResult> {
    const token = extractBearerToken(authorizationHeader)
    const requestedCpf = extractCpfFromToken(token)

    if (!requestedCpf) {
      return { result: [] }
    }

    const sysparmQuery = `opened_by.user_name=${requestedCpf}^ORinternal_user.user_name=${requestedCpf}`
    const sysparmFields = 'sys_id,number,state,active,short_description,opened_at,sys_updated_on,x_mdpdd_detran_csm_reopen_count,contact_type'

    return await this.serviceNowCsm.getProtocols<ListServiceCasesResult>({
      sysparm_query: sysparmQuery,
      sysparm_fields: sysparmFields,
      sysparm_limit: 50
    })
  }
}
