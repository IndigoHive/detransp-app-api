import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios'
import createError from 'http-errors'
import type { Logger } from 'pino'
import { DetranSpServiceNowLicenciamentoError } from './errors/detran-sp-service-now-licenciamento-error'

const SERVICE_NAME = 'detran-sp-servicenow-licenciamento'
const MAX_TIMEOUT_MS = 28000

export type DetranSpServiceNowLicenciamentoHttpParams = {
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

export class DetranSpServiceNowLicenciamentoHttp {
  protected axios: AxiosInstance
  protected logger: Logger

  constructor (params: DetranSpServiceNowLicenciamentoHttpParams) {
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
          'ServiceNow licenciamento request'
        )
        return config
      },
      (error) => {
        this.logger.error({ err: error?.message, service: SERVICE_NAME }, 'ServiceNow licenciamento request error')
        return Promise.reject(error)
      }
    )

    this.axios.interceptors.response.use(
      (response) => {
        this.logger.info(
          { method: response.config.method, service: SERVICE_NAME, status: response.status, url: response.config.url },
          'ServiceNow licenciamento response'
        )
        return response
      },
      (error: AxiosError) => {
        const data = error.response?.data as { error?: { message?: string; detail?: string } } | undefined
        const message = data?.error?.message
        const detail = data?.error?.detail

        this.logger.error(
          { service: SERVICE_NAME, status: error.response?.status, url: error.config?.url, errorMessage: message, errorDetail: detail },
          'ServiceNow licenciamento response error'
        )

        const userMessage = detail ?? 'Tivemos um problema ao processar sua solicitação.'
        const status = error.response?.status ?? 422

        throw createError(
          status,
          new DetranSpServiceNowLicenciamentoError(message ?? 'UnknownError', userMessage, error.response?.data),
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
