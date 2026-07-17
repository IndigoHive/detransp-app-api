import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios'
import createError from 'http-errors'
import type { Logger } from 'pino'
import type { VeiculoVistoriaRaw } from './types'

const SERVICE_NAME = 'rota-vistorias'

export type RotaVistoriasClientParams = {
  baseUrl: string
  logger: Logger
}

export class RotaVistoriasClient {
  private readonly axios: AxiosInstance
  private readonly logger: Logger

  constructor({ baseUrl, logger }: RotaVistoriasClientParams) {
    this.logger = logger

    this.axios = axios.create({
      baseURL: baseUrl,
      headers: { 'Content-Type': 'application/json' },
    })

    this.setupInterceptors()
  }

  private withAuth(accessToken: string) {
    return { headers: { Authorization: `Bearer ${accessToken}` } }
  }

  private buildRequestMeta(config?: AxiosRequestConfig) {
    if (!config) return undefined

    return {
      baseURL: config.baseURL,
      method: config.method,
      url: config.url,
    }
  }

  private setupInterceptors() {
    this.axios.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const meta = this.buildRequestMeta(error.config)

        this.logger.error(
          { ...meta, responseData: error.response?.data, service: SERVICE_NAME, status: error.response?.status },
          'Rota Vistorias HTTP error',
        )

        const message = error.response?.status === 401 || error.response?.status === 403
          ? 'Sessão expirada. Faça login novamente.'
          : 'Tivemos um problema ao processar sua solicitação.'

        throw createError(error.response?.status ?? 502, message, { expose: true })
      },
    )
  }

  async buscaVeiculoPorChassi(accessToken: string, chassi: string): Promise<VeiculoVistoriaRaw[]> {
    const response = await this.axios.get<VeiculoVistoriaRaw[]>('/v1/veiculos', {
      ...this.withAuth(accessToken),
      params: { chassi },
    })
    return response.data
  }
}
