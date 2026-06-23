import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import createError from 'http-errors'
import type { Logger } from 'pino'
import type { Config } from '../../types'
import type { GenerateGovBrAccessTokenCommand, GenerateGovBrAccessTokenResult } from './types'

const SERVICE_NAME = 'govbr-sso-idp'

export type IdpSpGovBrSSOClientParams = {
  config: Config
  logger: Logger
}

export class IdpSpGovBrSSOClient {
  private readonly axios: AxiosInstance
  private readonly config: Config
  private readonly logger: Logger

  constructor ({ config, logger }: IdpSpGovBrSSOClientParams) {
    this.config = config
    this.logger = logger

    this.axios = axios.create({
      baseURL: config.idsp.tokenUrl.replace(/\/token$/, ''),
      headers: {
        Accept: 'application/json'
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
          'GovBr SSO HTTP request'
        )
        return config
      },
      (error) => {
        this.logger.error(
          { err: error.message, service: SERVICE_NAME },
          'GovBr SSO HTTP request error'
        )
        return Promise.reject(error)
      }
    )

    this.axios.interceptors.response.use(
      (response) => {
        this.logger.debug(
          { method: response.config.method, service: SERVICE_NAME, status: response.status, url: response.config.url },
          'GovBr SSO HTTP response'
        )
        return response
      },
      (error) => {
        const meta = this.buildRequestMeta(error.config)
        const data = error.response?.data as { error?: string; error_description?: string } | undefined

        this.logger.error(
          { ...meta, responseData: data, service: SERVICE_NAME, status: error.response?.status },
          'GovBr SSO HTTP error'
        )

        return Promise.reject(createError(
          error.response?.status ?? 502,
          'Não foi possível concluir a autenticação com o Gov.br. Tente novamente.',
          { expose: true }
        ))
      }
    )
  }

  async generateAccessToken (data: GenerateGovBrAccessTokenCommand): Promise<GenerateGovBrAccessTokenResult> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: data.code,
      client_id: data.clientId,
      redirect_uri: data.redirectUri || '',
      code_verifier: data.codeVerifier
    })

    if (data.clientSecret) {
      body.set('client_secret', data.clientSecret)
    }

    const response = await this.axios.post<GenerateGovBrAccessTokenResult>(
      this.config.idsp.tokenUrl,
      body,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )

    return response.data
  }
}
