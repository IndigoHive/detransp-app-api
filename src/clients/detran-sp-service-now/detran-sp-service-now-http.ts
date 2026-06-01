import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios'
import type { Logger } from 'pino'
import { DetranSpServiceNowError } from './errors'

const SERVICE_NAME = 'detran-sp-servicenow'

export type DetranSpServiceNowHttpParams = {
  baseURL: string
  logger: Logger
  auth: {
    username: string
    password: string
  }
}

export class DetranSpServiceNowHttp {
  protected readonly axios: AxiosInstance
  protected readonly logger: Logger

  constructor (params: DetranSpServiceNowHttpParams) {
    this.logger = params.logger

    this.axios = axios.create({
      baseURL: params.baseURL,
      auth: params.auth,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    })

    this.setupInterceptors()
  }

  private buildRequestMeta (config?: AxiosRequestConfig) {
    if (!config) return undefined

    return {
      baseURL: config.baseURL,
      method: config.method,
      url: config.url
    }
  }

  private setupInterceptors () {
    this.axios.interceptors.request.use(
      (config) => {
        this.logger.debug(
          { method: config.method, service: SERVICE_NAME, url: config.url },
          'ServiceNow HTTP request'
        )
        return config
      },
      (error: AxiosError) => {
        this.logger.error(
          { err: error.message, service: SERVICE_NAME },
          'ServiceNow HTTP request error'
        )
        return Promise.reject(error)
      }
    )

    this.axios.interceptors.response.use(
      (response) => {
        this.logger.debug(
          { method: response.config.method, service: SERVICE_NAME, status: response.status, url: response.config.url },
          'ServiceNow HTTP response'
        )
        return response
      },
      (error: AxiosError) => {
        const meta = this.buildRequestMeta(error.config)
        const data = error.response?.data as { error?: { message?: string; detail?: string } } | undefined

        this.logger.error(
          { ...meta, responseData: data, service: SERVICE_NAME, status: error.response?.status },
          'ServiceNow HTTP error'
        )

        const detail = data?.error?.detail ?? 'Tivemos um problema ao processar sua solicitação.'
        throw new DetranSpServiceNowError(detail)
      }
    )
  }
}
