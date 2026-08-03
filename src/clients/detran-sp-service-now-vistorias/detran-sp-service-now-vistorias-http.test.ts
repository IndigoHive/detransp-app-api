import type { AxiosRequestConfig } from 'axios'
import type { Logger } from 'pino'
import { describe, expect, it } from 'vitest'
import { DetranSpServiceNowVistoriasHttp } from './detran-sp-service-now-vistorias-http'

class TestVistoriasHttp extends DetranSpServiceNowVistoriasHttp {
  getAuthConfig (): AxiosRequestConfig {
    return this.withAuth({ token: 'govbr-access-token', cpf: '12345678901' })
  }
}

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
