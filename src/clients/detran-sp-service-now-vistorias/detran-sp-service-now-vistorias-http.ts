import axios, { type AxiosError, type AxiosInstance } from 'axios'
import createError from 'http-errors'
import type { Logger } from 'pino'
import { DetranSpServiceNowVistoriasError } from './errors/detran-sp-service-now-vistorias-error'

const SERVICE_NAME = 'detran-sp-servicenow-vistorias'
const MAX_TIMEOUT_MS = 8000
const TIMEOUT_ERROR_CODES = new Set(['ECONNABORTED', 'ETIMEDOUT'])

export type DetranSpServiceNowVistoriasHttpParams = {
  baseURL: string
  logger: Logger
}

export class DetranSpServiceNowVistoriasHttp {
  protected readonly axios: AxiosInstance
  private readonly logger: Logger

  constructor (params: DetranSpServiceNowVistoriasHttpParams) {
    this.logger = params.logger
    this.axios = axios.create({
      baseURL: params.baseURL,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'iOS/appsp/1.0.0'
      },
      timeout: MAX_TIMEOUT_MS,
      withCredentials: true
    })
    this.setupInterceptors()
  }

  private setupInterceptors () {
    this.axios.interceptors.request.use((config) => {
      this.logger.debug(
        { baseURL: config.baseURL, method: config.method, timeout: config.timeout, url: config.url, service: SERVICE_NAME },
        'ServiceNow vistorias request'
      )
      return config
    })

    this.axios.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const data = error.response?.data as {
          error?: { message?: string; detail?: string }
          errors?: Array<{ title?: string; detail?: string }>
        } | undefined
        const message = data?.error?.message ?? data?.errors?.[0]?.title
        const detail = data?.error?.detail ?? data?.errors?.[0]?.detail

        this.logger.error(
          {
            service: SERVICE_NAME,
            status: error.response?.status,
            url: error.config?.url,
            errorMessage: message,
            errorDetail: detail
          },
          'ServiceNow vistorias response error'
        )

        const status = error.response?.status ?? (TIMEOUT_ERROR_CODES.has(error.code ?? '') ? 504 : 502)

        throw createError(
          status,
          new DetranSpServiceNowVistoriasError(
            message ?? 'UnknownError',
            detail ?? 'Tivemos um problema ao processar sua solicitação.',
            error.response?.data
          ),
          { expose: true }
        )
      }
    )
  }
}
