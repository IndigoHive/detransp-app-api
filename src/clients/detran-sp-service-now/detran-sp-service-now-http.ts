import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios'
import createError from 'http-errors'
import type { Logger } from 'pino'
import { DetranSpServiceNowError } from './errors/detran-sp-service-now-error'

const SERVICE_NAME = 'detran-sp-servicenow'
const DEFAULT_ERROR_DETAIL = 'Tivemos um problema ao processar sua solicitação.'

export type DetranSpServiceNowHttpParams = {
  baseURL: string
  logger: Logger
  serviceName?: string
  userAgent?: string
  withCredentials?: boolean
}

export type DetranSpServiceNowAuth = {
  token: string
  cpf: string
}

export class DetranSpServiceNowHttp {
  protected readonly axios: AxiosInstance
  protected readonly logger: Logger
  private readonly serviceName: string

  constructor (params: DetranSpServiceNowHttpParams) {
    this.logger = params.logger
    this.serviceName = params.serviceName ?? SERVICE_NAME

    this.axios = axios.create({
      baseURL: params.baseURL,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(params.userAgent ? { 'User-Agent': params.userAgent } : {})
      },
      ...(params.withCredentials === undefined ? {} : { withCredentials: params.withCredentials })
    })

    this.setupInterceptors()
  }

  protected withAuth (auth: DetranSpServiceNowAuth): AxiosRequestConfig {
    if (!auth.token || !auth.cpf) {
      throw createError(401, 'Token de autorização inválido ou expirado, ou CPF ausente.', { expose: true })
    }

    return {
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'sn-token': auth.token,
        'X-CPF-Usuario': auth.cpf
      }
    }
  }

  protected createResponseError (error: AxiosError): Error {
    const data = error.response?.data as { error?: { message?: string, detail?: string } } | undefined
    const message = data?.error?.message ?? 'UnknownError'
    const detail = data?.error?.detail ?? DEFAULT_ERROR_DETAIL
    return createError(
      error.response?.status ?? 502,
      new DetranSpServiceNowError(message, detail, error.response?.data),
      { expose: true }
    )
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
        const fullUrl = `${config.baseURL ?? ''}${config.url ?? ''}`

        this.logger.debug(
          {
            method: config.method,
            service: this.serviceName,
            url: config.url,
            fullUrl,
            params: config.params,
            data: config.data,
          },
          'ServiceNow HTTP request'
        )
        return config
      },
      (error: AxiosError) => {
        this.logger.error(
          { err: error.message, service: this.serviceName },
          'ServiceNow HTTP request error'
        )
        return Promise.reject(error)
      }
    )

    this.axios.interceptors.response.use(
      (response) => {
        this.logger.debug(
          {
            method: response.config.method,
            service: this.serviceName,
            status: response.status,
            url: response.config.url,
            transactionId: response.headers['x-transaction-id'],
            data: response.data,
          },
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
            service: this.serviceName,
            status: error.response?.status,
            errorCode: error.code,
            errorMessage: error.message,
            transactionId: error.response?.headers?.['x-transaction-id'],
          },
          'ServiceNow HTTP error'
        )

        throw this.createResponseError(error)
      }
    )
  }
}
