import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios'
import createError from 'http-errors'
import type { Logger } from 'pino'
import { DetranSpServiceNowError } from './errors/detran-sp-service-now-error'

const SERVICE_NAME = 'detran-sp-servicenow'
const DEFAULT_ERROR_DETAIL = 'Tivemos um problema ao processar sua solicitação.'

type ServiceNowErrorBody = { error?: { message?: string, detail?: string } }

// ServiceNow has answered 406 with raw newlines inside JSON strings — invalid JSON, so axios
// hands the body over as text and the real reason ("Ficha cadastral já registrada anteriormente")
// would be lost behind the generic message. Turning the control characters into spaces recovers
// it, and is harmless where they were only formatting.
export function parseServiceNowErrorBody (data: unknown): ServiceNowErrorBody | undefined {
  if (typeof data === 'object' && data !== null) return data as ServiceNowErrorBody
  if (typeof data !== 'string' || !data.trim()) return undefined

  try {
    return JSON.parse(data) as ServiceNowErrorBody
  } catch {
    try {
      return JSON.parse(data.replace(/[\n\r\t]+/g, ' ')) as ServiceNowErrorBody
    } catch {
      return undefined
    }
  }
}

// The error name is sometimes packed into the message together with the reason
// ("RestricaoEncontradaError: Ficha cadastral já registrada anteriormente"). Everything that
// matches on the type — mapPendenciaError, ValidarTdvService — needs it split back out.
function splitTipo (texto: string): { type: string, detalhe?: string } {
  const separador = texto.indexOf(':')
  if (separador < 0) return { type: texto.trim() }

  const type = texto.slice(0, separador).trim()
  const detalhe = texto.slice(separador + 1).trim()
  return /error$/i.test(type) && detalhe ? { type, detalhe } : { type: texto.trim() }
}

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
    const body = parseServiceNowErrorBody(error.response?.data)
    const rawMessage = body?.error?.message?.trim()
    const rawDetail = body?.error?.detail?.trim()

    const { type, detalhe } = rawMessage ? splitTipo(rawMessage) : { type: 'UnknownError' }
    const detail = detalhe
      ?? (rawDetail ? splitTipo(rawDetail).detalhe ?? rawDetail : undefined)
      ?? DEFAULT_ERROR_DETAIL

    return createError(
      error.response?.status ?? 502,
      new DetranSpServiceNowError(type, detail, body ?? error.response?.data),
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
        const data = parseServiceNowErrorBody(error.response?.data) ?? error.response?.data
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
