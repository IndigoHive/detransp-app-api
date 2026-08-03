import type { AxiosError } from 'axios'
import createError from 'http-errors'
import { DetranSpServiceNowHttp } from '../detran-sp-service-now/detran-sp-service-now-http'
import { DetranSpServiceNowVistoriasError } from './errors/detran-sp-service-now-vistorias-error'

const TIMEOUT_ERROR_CODES = new Set(['ECONNABORTED', 'ETIMEDOUT'])

type ServiceNowErrorData = {
  error?: { message?: string; detail?: string }
  errors?: Array<{ title?: string; detail?: string }>
}

export class DetranSpServiceNowVistoriasHttp extends DetranSpServiceNowHttp {
  protected override createResponseError (error: AxiosError): Error {
    const data = error.response?.data as ServiceNowErrorData | undefined
    const message = data?.error?.message ?? data?.errors?.[0]?.title
    const detail = data?.error?.detail ?? data?.errors?.[0]?.detail
    const status = error.response?.status ?? (TIMEOUT_ERROR_CODES.has(error.code ?? '') ? 504 : 502)

    return createError(
      status,
      new DetranSpServiceNowVistoriasError(
        message ?? 'UnknownError',
        detail ?? 'Tivemos um problema ao processar sua solicitação.',
        error.response?.data
      ),
      { expose: true }
    )
  }
}
