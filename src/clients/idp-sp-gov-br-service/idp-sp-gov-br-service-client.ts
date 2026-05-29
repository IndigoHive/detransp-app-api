import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import type { Logger } from 'pino'
import type { Config } from '../../types'
import type { GetUserInfoResult } from './types'

const SERVICE_NAME = 'govbr-service-idp'

export type IdpSpGovBrServiceClientParams = {
  config: Config
  logger: Logger
}

export class IdpSpGovBrServiceClient {
  private readonly axios: AxiosInstance
  private readonly config: Config
  private readonly logger: Logger

  constructor ({ config, logger }: IdpSpGovBrServiceClientParams) {
    this.config = config
    this.logger = logger

    this.axios = axios.create({
      baseURL: config.idsp.userInfoUrl.replace(/\/userinfo$/, ''),
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
          'GovBr Service IDP HTTP request'
        )
        return config
      },
      (error) => {
        this.logger.error(
          { err: error.message, service: SERVICE_NAME },
          'GovBr Service IDP HTTP request error'
        )
        return Promise.reject(error)
      }
    )

    this.axios.interceptors.response.use(
      (response) => {
        this.logger.debug(
          { method: response.config.method, service: SERVICE_NAME, status: response.status, url: response.config.url },
          'GovBr Service IDP HTTP response'
        )
        return response
      },
      (error) => {
        const meta = this.buildRequestMeta(error.config)
        const data = error.response?.data as { message?: string } | undefined

        this.logger.error(
          { ...meta, responseData: data, service: SERVICE_NAME, status: error.response?.status },
          'GovBr Service IDP HTTP error'
        )

        return Promise.reject(error)
      }
    )
  }

  private withAuth (accessToken: string) {
    return {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  }

  async getUserInfo (accessToken: string): Promise<GetUserInfoResult> {
    const response = await this.axios.get<GetUserInfoResult>(
      this.config.idsp.userInfoUrl,
      this.withAuth(accessToken)
    )

    return response.data
  }
}
