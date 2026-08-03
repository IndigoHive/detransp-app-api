import type { AxiosRequestConfig } from 'axios'
import type { Logger } from 'pino'
import { describe, expect, it } from 'vitest'
import { DetranSpServiceNowVistoriasHttp, getVistoriasErrorMessage } from './detran-sp-service-now-vistorias-http'

class TestVistoriasHttp extends DetranSpServiceNowVistoriasHttp {
  getAuthConfig (): AxiosRequestConfig {
    return this.withAuth({ token: 'govbr-access-token', cpf: '12345678901' })
  }
}

describe('getVistoriasErrorMessage', () => {
  it('uses the ServiceNow error message when no detail is provided', () => {
    expect(getVistoriasErrorMessage({
      error: { message: 'Nenhum anexo encontrado para o número informado.' }
    })).toBe('Nenhum anexo encontrado para o número informado.')
  })

  it('supports a failed result response', () => {
    expect(getVistoriasErrorMessage({
      result: {
        success: false,
        message: 'Nenhum anexo encontrado para o número informado.'
      }
    })).toBe('Nenhum anexo encontrado para o número informado.')
  })

  it('prefers the error detail and keeps a generic fallback', () => {
    expect(getVistoriasErrorMessage({
      error: {
        message: 'DocumentNotFoundError',
        detail: 'Nenhum anexo encontrado para o número informado.'
      }
    })).toBe('Nenhum anexo encontrado para o número informado.')
    expect(getVistoriasErrorMessage(undefined)).toBe('Tivemos um problema ao processar sua solicitação.')
  })
})

describe('DetranSpServiceNowVistoriasHttp', () => {
  it('uses the shared ServiceNow authentication headers', () => {
    const logger = { debug: () => undefined, error: () => undefined } as unknown as Logger
    const http = new TestVistoriasHttp({ baseURL: 'https://servicenow.example', logger })

    expect(http.getAuthConfig()).toEqual({
      headers: {
        Authorization: 'Bearer govbr-access-token',
        'sn-token': 'govbr-access-token',
        'X-CPF-Usuario': '12345678901'
      }
    })
  })
})
