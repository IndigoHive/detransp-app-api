import type { ServiceNowCsmClient } from '../../../clients'
import type { Logger } from 'pino'
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
  logger: Logger
}

const DEFAULT_CPF = '22231049830'

export class ListServiceCasesService {
  private readonly serviceNowCsm: ServiceNowCsmClient
  private readonly logger: Logger

  constructor ({ serviceNowCsm, logger }: Dependencies) {
    this.serviceNowCsm = serviceNowCsm
    this.logger = logger
  }

  async run (authorizationHeader?: string): Promise<ListServiceCasesResult> {
    try {
      const cpf = authorizationHeader
        ? extractCpfFromToken(extractBearerToken(authorizationHeader))
        : DEFAULT_CPF

      const sysparmQuery = `opened_by.user_name=${cpf}^ORinternal_user.user_name=${cpf}`
      const sysparmFields = 'sys_id,number,state,active,short_description,opened_at,sys_updated_on,x_mdpdd_detran_csm_reopen_count,contact_type'

      return await this.serviceNowCsm.getProtocols<ListServiceCasesResult>({
        sysparm_query: sysparmQuery,
        sysparm_fields: sysparmFields,
        sysparm_limit: 50
      })
    } catch (error) {
      this.logger.error(
        {
          err: error,
          hasAuthorizationHeader: Boolean(authorizationHeader),
          service: 'list-service-cases'
        },
        'Failed preparing or executing protocols listing'
      )

      throw error
    }
  }
}
