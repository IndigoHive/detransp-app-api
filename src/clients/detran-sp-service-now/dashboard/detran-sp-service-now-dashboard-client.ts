import axios, { type AxiosError, type AxiosInstance } from 'axios'
import createError from 'http-errors'
import type { Logger } from 'pino'
import type { Config } from '../../../types'
import { sanitizeResponseData } from '../../../utils/token'
import { reportOutboundHttpError } from '../../report-outbound-http-error'
import { installHttpMetrics } from '../../install-http-metrics'

const SERVICE_NAME = 'detran-sp-servicenow-dashboard'

export type DetranSpServiceNowDashboardClientParams = {
  config: Config
  logger: Logger
}

export class DetranSpServiceNowDashboardClient {
  private readonly axios: AxiosInstance
  private readonly logger: Logger
  private readonly dashboardUrl: string

  constructor({ config, logger }: DetranSpServiceNowDashboardClientParams) {
    this.logger = logger
    this.dashboardUrl = config.serviceNow.api.dashboardUrl

    this.axios = axios.create({
      baseURL: config.serviceNow.api.baseUrl,
      timeout: 30000,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })

    installHttpMetrics(this.axios, SERVICE_NAME)
    this.setupInterceptors()
  }

  private setupInterceptors() {
    this.axios.interceptors.request.use((config) => {
      this.logger.debug(
        { method: config.method, service: SERVICE_NAME, url: config.url },
        'ServiceNow dashboard request',
      )
      return config
    })

    this.axios.interceptors.response.use(
      (response) => {
        this.logger.debug(
          { method: response.config.method, service: SERVICE_NAME, status: response.status, url: response.config.url },
          'ServiceNow dashboard response',
        )
        return response
      },
      (error: AxiosError) => {
        this.logger.error(
          {
            service: SERVICE_NAME,
            status: error.response?.status,
            url: error.config?.url,
            responseData: sanitizeResponseData(error.response?.data),
          },
          'ServiceNow dashboard error',
        )
        reportOutboundHttpError(error, SERVICE_NAME)
        const status = error.response?.status ?? 500
        const message = status === 401
          ? 'Sessão expirada. Faça login novamente.'
          : 'Não foi possível carregar os dados do dashboard.'
        throw createError(status, message, { expose: true })
      },
    )
  }

  private authHeaders(token: string, cpf: string) {
    return {
      Authorization: `Bearer ${token}`,
      'sn-token': token,
      'X-CPF-Usuario': cpf,
    }
  }

  async get<T = unknown>(
    path: string,
    token: string,
    cpf: string,
    params?: Record<string, string | boolean | number>,
  ): Promise<T> {
    const response = await this.axios.get<T>(`${this.dashboardUrl}${path}`, {
      params,
      headers: this.authHeaders(token, cpf),
    })
    return response.data
  }
}
