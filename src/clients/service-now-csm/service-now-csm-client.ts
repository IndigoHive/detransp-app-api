import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import type { Logger } from 'pino'
import type { Config } from '../../types'

export type UploadAttachmentParams = {
  tableName: string
  tableSysId: string
  fileName: string
  fileBuffer: Buffer
  contentType?: string | undefined
}

const SERVICE_NAME = 'servicenow-csm'

export type ServiceNowCsmClientParams = {
  config: Config
  logger: Logger
}

export class ServiceNowCsmClient {
  private readonly axios: AxiosInstance
  private readonly logger: Logger

  constructor ({ config, logger }: ServiceNowCsmClientParams) {
    this.logger = logger

    const { baseUrl, username, password } = config.serviceNow.csm

    this.axios = axios.create({
      baseURL: baseUrl,
      auth: {
        username,
        password
      },
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
          'ServiceNow CSM HTTP request'
        )
        return config
      },
      (error) => {
        this.logger.error(
          { err: error.message, service: SERVICE_NAME },
          'ServiceNow CSM HTTP request error'
        )
        return Promise.reject(error)
      }
    )

    this.axios.interceptors.response.use(
      (response) => {
        this.logger.debug(
          { method: response.config.method, service: SERVICE_NAME, status: response.status, url: response.config.url },
          'ServiceNow CSM HTTP response'
        )
        return response
      },
      (error) => {
        const meta = this.buildRequestMeta(error.config)
        const data = error.response?.data as { error?: { message?: string; detail?: string } } | undefined

        this.logger.error(
          { ...meta, responseData: data, service: SERVICE_NAME, status: error.response?.status },
          'ServiceNow CSM HTTP error'
        )

        return Promise.reject(error)
      }
    )
  }

  async submitProducer<T = unknown> (catalogItemId: string, payload: unknown): Promise<T> {
    const response = await this.axios.post<T>(
      `/api/sn_sc/v1/servicecatalog/items/${catalogItemId}/submit_producer`,
      payload
    )

    return response.data
  }

  async uploadAttachment<T = unknown> ({ tableName, tableSysId, fileName, fileBuffer, contentType }: UploadAttachmentParams): Promise<T> {
    const formData = new FormData()
    const fileBytes = new Uint8Array(fileBuffer)

    formData.append('table_name', tableName)
    formData.append('table_sys_id', tableSysId)
    formData.append('uploadFile', new Blob([fileBytes], { type: contentType ?? 'application/octet-stream' }), fileName)

    const response = await this.axios.post<T>('/api/now/attachment/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return response.data
  }

  async getProtocols<T = unknown> (params?: Record<string, string | number | boolean>): Promise<T> {
    try {
      const response = await this.axios.get<T>('/api/now/table/x_mdpdd_detran_srv_service_case', {
        params
      })

      return response.data
    } catch (error) {
      this.logger.error(
        {
          err: error,
          endpoint: '/api/now/table/x_mdpdd_detran_srv_service_case',
          params,
          service: SERVICE_NAME
        },
        'Failed to fetch protocols from ServiceNow CSM'
      )

      throw error
    }
  }

  async getProtocolDetail<T = unknown> (
    protocolId: string,
    params?: Record<string, string | number | boolean>
  ): Promise<T> {
    try {
      const response = await this.axios.get<T>(
        `/api/now/table/x_mdpdd_detran_srv_service_case/${protocolId}`,
        { params }
      )

      return response.data
    } catch (error) {
      this.logger.error(
        {
          err: error,
          endpoint: `/api/now/table/x_mdpdd_detran_srv_service_case/${protocolId}`,
          params,
          service: SERVICE_NAME
        },
        'Failed to fetch protocol detail from ServiceNow CSM'
      )

      throw error
    }
  }
}
