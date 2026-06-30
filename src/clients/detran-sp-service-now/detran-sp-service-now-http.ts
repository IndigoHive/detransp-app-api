import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios'
import createError from 'http-errors'
import type { Logger } from 'pino'

const SERVICE_NAME = 'detran-sp-servicenow'

export type DetranSpServiceNowHttpParams = {
  baseURL: string
  logger: Logger
}

export type DetranSpServiceNowAuth = {
  token: string
  cpf: string
}

export class DetranSpServiceNowHttp {
  protected readonly axios: AxiosInstance
  protected readonly logger: Logger

  constructor (params: DetranSpServiceNowHttpParams) {
    this.logger = params.logger

    this.axios = axios.create({
      baseURL: params.baseURL,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    })


    this.setupInterceptors()
  }

  protected withAuth (auth: DetranSpServiceNowAuth): AxiosRequestConfig {
    return {
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'sn-token': auth.token,
        'X-CPF-Usuario': auth.cpf,
      }
    }
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
        const fullUrl = error.config
          ? `${error.config.baseURL ?? ''}${error.config.url ?? ''}`
          : 'unknown'

        this.logger.error(
          {
            ...meta,
            fullUrl,
            responseData: data,
            service: SERVICE_NAME,
            status: error.response?.status,
            errorCode: error.code,
            errorMessage: error.message,
          },
          'ServiceNow HTTP error'
        )

        const detail = data?.error?.detail ?? 'Tivemos um problema ao processar sua solicitação.'
        throw createError(error.response?.status ?? 502, detail, { expose: true })
      }
    )
  }
}
