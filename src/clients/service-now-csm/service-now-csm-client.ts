import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import createError from 'http-errors'
import type { Logger } from 'pino'
import type { Config } from '../../types'

export type UploadAttachmentParams = {
  tableName: string
  tableSysId: string
  fileName: string
  fileBuffer: Buffer
  contentType?: string | undefined
}

export type ProtocolMessage = {
  sys_id: string
  sys_created_on: string
  name: string
  element_id: string
  sys_tags: string
  value: string
  sys_created_by: string
  element: string
}

export type GetProtocolMessagesResult = {
  result: ProtocolMessage[]
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

  async addComment<T = unknown> (protocolId: string, comment: string): Promise<T> {
    const response = await this.axios.patch<T>(
      `/api/now/table/x_mdpdd_detran_srv_service_case/${protocolId}`,
      { comments: comment }
    )

    return response.data
  }

  async finalizeProtocol (protocolId: string): Promise<void> {
    await this.axios.patch(
      `/api/now/table/x_mdpdd_detran_srv_service_case/${protocolId}`,
      {
        comments: 'Solicitação encerrada pelo aplicativo Detran-SP',
        state: '3',
      }
    )
  }

  async getProtocols<T = unknown> (params?: Record<string, string | number | boolean>): Promise<T> {
    try {
      const response = await this.axios.get<T>('/api/now/table/x_mdpdd_detran_srv_service_case', {
        params
      })

      return response.data
    } catch (error) {
      throw createError(
        (axios.isAxiosError(error) ? error.response?.status : undefined) ?? 500,
        'Não foi possível completar a operação no ServiceNow CSM.',
        { expose: true }
      )
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
      throw createError(
        (axios.isAxiosError(error) ? error.response?.status : undefined) ?? 500,
        'Não foi possível completar a operação no ServiceNow CSM.',
        { expose: true }
      )
    }
  }

  async getOpenedBy<T = unknown> (
    sysUserId: string,
    params?: Record<string, string | number | boolean>
  ): Promise<T> {
    try {
      const response = await this.axios.get<T>(
        `/api/now/table/sys_user/${sysUserId}`,
        { params }
      )

      return response.data
    } catch (error) {
      throw createError(
        (axios.isAxiosError(error) ? error.response?.status : undefined) ?? 500,
        'Não foi possível completar a operação no ServiceNow CSM.',
        { expose: true }
      )
    }
  }


  async getProtocolMessages (protocolId: string): Promise<GetProtocolMessagesResult> {
    try {
      const response = await this.axios.get<GetProtocolMessagesResult>('/api/now/table/sys_journal_field', {
        params: {
          sysparm_query: `element_id=${protocolId}`,
          sysparm_order_by_desc: 'sys_created_on',
          sysparm_limit: 1,
        },
      })

      return response.data
    } catch (error) {
      throw createError(
        (axios.isAxiosError(error) ? error.response?.status : undefined) ?? 500,
        'Não foi possível completar a operação no ServiceNow CSM.',
        { expose: true }
      )
    }
  }
}
