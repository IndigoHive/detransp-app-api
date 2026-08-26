import type { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'
import { DetranSpServiceNowError } from './errors/detran-sp-service-now-error'
import { DetranSpServiceNowHttp, parseServiceNowErrorBody } from './detran-sp-service-now-http'

// The real payload homologação answered with: a raw newline inside a JSON string, which makes
// the body invalid JSON — axios then leaves it as text.
const CORPO_QUEBRADO = `{
    "error": {
    "message": "RestricaoEncontradaError:
Ficha cadastral já registrada anteriormente",
    "detail": "RestricaoEncontradaError:
Ficha cadastral já registrada anteriormente"
},
    "status": "failure"
}`

class Exposed extends DetranSpServiceNowHttp {
  build (error: AxiosError): Error {
    return this.createResponseError(error)
  }
}

function asAxiosError (data: unknown, status = 406): AxiosError {
  return { response: { data, status } } as AxiosError
}

function build (data: unknown, status?: number): { status: number, snError: DetranSpServiceNowError } {
  const client = new Exposed({
    baseURL: 'https://example.invalid',
    logger: { debug () {}, info () {}, warn () {}, error () {} } as never
  })
  const error = client.build(asAxiosError(data, status)) as Error & {
    status: number
    cause?: unknown
  }
  return { status: error.status, snError: (error.cause ?? error) as DetranSpServiceNowError }
}

describe('parseServiceNowErrorBody', () => {
  it('recovers a body with raw control characters inside the strings', () => {
    expect(parseServiceNowErrorBody(CORPO_QUEBRADO)?.error?.message)
      .toContain('Ficha cadastral já registrada anteriormente')
  })

  it('passes an already parsed body straight through', () => {
    const body = { error: { message: 'TDVAtivaExistenteError', detail: 'Já existe' } }
    expect(parseServiceNowErrorBody(body)).toBe(body)
  })

  it('gives up on something that is not a body', () => {
    expect(parseServiceNowErrorBody('<html>502 Bad Gateway</html>')).toBeUndefined()
    expect(parseServiceNowErrorBody(undefined)).toBeUndefined()
  })
})

describe('DetranSpServiceNowHttp.createResponseError', () => {
  it('splits the type from the reason when ServiceNow packs both into the message', () => {
    const { status, snError } = build(CORPO_QUEBRADO)

    expect(status).toBe(406)
    expect(snError.type).toBe('RestricaoEncontradaError')
    // The reason has to reach the citizen — it is the only actionable part of the response.
    expect(snError.detail).toBe('Ficha cadastral já registrada anteriormente')
    expect(snError.message).toBe('Ficha cadastral já registrada anteriormente')
  })

  it('keeps a well-formed error untouched', () => {
    const { snError } = build({
      error: { message: 'TDVAtivaExistenteError', detail: 'Já existe uma TDV ativa para o veículo' }
    })

    expect(snError.type).toBe('TDVAtivaExistenteError')
    expect(snError.detail).toBe('Já existe uma TDV ativa para o veículo')
  })

  it('falls back to the generic detail when the body says nothing', () => {
    const { snError } = build('<html>502 Bad Gateway</html>', 502)

    expect(snError.type).toBe('UnknownError')
    expect(snError.detail).toBe('Tivemos um problema ao processar sua solicitação.')
  })
})
