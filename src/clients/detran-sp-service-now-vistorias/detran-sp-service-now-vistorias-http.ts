import type { AxiosError } from 'axios'
import createError from 'http-errors'
import { DetranSpServiceNowHttp } from '../detran-sp-service-now/detran-sp-service-now-http'
import { DetranSpServiceNowVistoriasError } from './errors/detran-sp-service-now-vistorias-error'

const TIMEOUT_ERROR_CODES = new Set(['ECONNABORTED', 'ETIMEDOUT'])
const DEFAULT_ERROR_MESSAGE = 'Tivemos um problema ao processar sua solicitação.'

type ServiceNowErrorData = {
  error?: { message?: string; detail?: string }
  errors?: Array<{ title?: string; detail?: string }>
  message?: string
  result?: {
    success?: boolean
    message?: string
  }
}

export function getVistoriasErrorMessage (data: ServiceNowErrorData | undefined): string {
  return data?.error?.detail
    ?? data?.errors?.[0]?.detail
    ?? data?.result?.message
    ?? data?.error?.message
    ?? data?.errors?.[0]?.title
    ?? data?.message
    ?? DEFAULT_ERROR_MESSAGE
}

export class DetranSpServiceNowVistoriasHttp extends DetranSpServiceNowHttp {
  protected override createResponseError (error: AxiosError): Error {
    const data = error.response?.data as ServiceNowErrorData | undefined
    const message = data?.error?.message ?? data?.errors?.[0]?.title
    const status = error.response?.status ?? (TIMEOUT_ERROR_CODES.has(error.code ?? '') ? 504 : 502)

    return createError(
      status,
      new DetranSpServiceNowVistoriasError(
        message ?? 'UnknownError',
        getVistoriasErrorMessage(data),
        error.response?.data
      ),
      { expose: true }
    )
  }
}
