import { AxiosInstance, isAxiosError } from 'axios'
import type { Logger } from 'pino'
import { Config } from '../../../types'
import { extractBearerToken, extractCpfFromToken, sanitizeResponseData } from '../../../utils/token'

export class GetMeusVeiculosService {
  constructor(
    private serviceNowApiClient: AxiosInstance,
    private logger: Logger,
    private config: Config,
  ) {}

  async run(authorizationHeader: string | undefined): Promise<unknown> {
    const token = extractBearerToken(authorizationHeader)
    const cpf = extractCpfFromToken(token)
    const { dashboardUrl } = this.config.serviceNow.api
    try {
      const response = await this.serviceNowApiClient.get(`${dashboardUrl}meusVeiculos`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'sn-token': token,
          'X-CPF-Usuario': cpf,
          Accept: 'application/json',
        },
      })
      return response.data
    } catch (error) {
      const responseData = sanitizeResponseData(isAxiosError(error) ? error.response?.data : undefined)
      this.logger.error({ responseData, err: error instanceof Error ? error.message : error }, '[getMeusVeiculos] error')
      throw error
    }
  }
}
