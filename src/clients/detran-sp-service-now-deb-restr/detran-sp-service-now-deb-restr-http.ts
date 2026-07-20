import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios'
import createError from 'http-errors'
import type { Logger } from 'pino'
import { DetranSpServiceNowDebRestrError } from './errors/detran-sp-service-now-deb-restr-error'

const SERVICE_NAME = 'detran-sp-servicenow-deb-restr'
const MAX_TIMEOUT_MS = 30000

export type DetranSpServiceNowDebRestrHttpParams = {
  baseURL: string
  logger: Logger
}

export type DetranSpServiceNowClientAuth = {
  accessToken: string
  userCpf: string
  tokenIntegrity?: string
}

export type DetranSpServiceNowClientAuthWithVeiculo = DetranSpServiceNowClientAuth & {
  renavam: string
  placa: string
}

export class DetranSpServiceNowDebRestrHttp {
  protected axios: AxiosInstance
  protected logger: Logger

  constructor (params: DetranSpServiceNowDebRestrHttpParams) {
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
    this.axios.interceptors.request.use(
      (config) => {
        this.logger.debug(
          { baseURL: config.baseURL, method: config.method, timeout: config.timeout, url: config.url, service: SERVICE_NAME },
          'ServiceNow deb-restr request'
        )
        return config
      },
      (error) => {
        this.logger.error({ err: error?.message, service: SERVICE_NAME }, 'ServiceNow deb-restr request error')
        return Promise.reject(error)
      }
    )

    this.axios.interceptors.response.use(
      (response) => {
        this.logger.info(
          { method: response.config.method, service: SERVICE_NAME, status: response.status, url: response.config.url },
          'ServiceNow deb-restr response'
        )
        return response
      },
      (error: AxiosError) => {
        const data = error.response?.data as { error?: { message?: string; detail?: string } } | undefined
        const message = data?.error?.message
        const detail = data?.error?.detail
        // Without a response (timeout, DNS, connection reset), status/message
        // above are undefined — that used to log as an unexplained blank
        // error. Surface the axios error code/message explicitly so a
        // timeout is never indistinguishable from a real upstream 4xx/5xx.
        const noResponse = !error.response

        this.logger.error(
          {
            service: SERVICE_NAME,
            method: error.config?.method,
            status: error.response?.status,
            url: error.config?.url,
            errorMessage: message,
            errorDetail: detail,
            ...(noResponse ? { networkErrorCode: error.code, networkErrorMessage: error.message } : {})
          },
          'ServiceNow deb-restr response error'
        )

        const userMessage = detail ?? 'Tivemos um problema ao processar sua solicitação.'
        const status = error.response?.status ?? 422

        throw createError(
          status,
          new DetranSpServiceNowDebRestrError(message ?? 'UnknownError', userMessage, error.response?.data),
          { expose: true }
        )
      }
    )
  }

  protected withAuth (auth: DetranSpServiceNowClientAuthWithVeiculo): AxiosRequestConfig
  protected withAuth (auth: DetranSpServiceNowClientAuth): AxiosRequestConfig
  protected withAuth (auth: DetranSpServiceNowClientAuth | DetranSpServiceNowClientAuthWithVeiculo): AxiosRequestConfig {
    const hasVeiculo = 'renavam' in auth

    return {
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        'sn-token': auth.accessToken,
        'X-CPF-Usuario': auth.userCpf,
        ...(auth.tokenIntegrity ? { 'X-Integrity-Token': auth.tokenIntegrity } : {}),
        ...(hasVeiculo
          ? { codigoRenavamVeiculo: auth.renavam, 'X-Placa-Veiculo': auth.placa.toUpperCase() }
          : {})
      }
    }
  }
}
