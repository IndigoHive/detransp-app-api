import { describe, expect, test, vi } from 'vitest'
import type { Config } from '../../types'
import { buildAttestationError, DetranSpServiceNowAttestationClient } from './detran-sp-service-now-attestation-client'

function build () {
  const config = {
    serviceNow: { api: { baseUrl: 'https://example.invalid' } }
  } as unknown as Config
  const logger = { debug () {}, info () {}, warn () {}, error () {} } as never
  const client = new DetranSpServiceNowAttestationClient({ config, logger })
  const post = vi.fn()
  ;(client as unknown as { axios: { post: typeof post } }).axios.post = post
  return { client, post }
}

describe('DetranSpServiceNowAttestationClient.validateAttestationToken', () => {
  test('resolves the access token on success (statusCode/data direto no result)', async () => {
    const { client, post } = build()
    post.mockResolvedValue({
      data: {
        result: {
          statusCode: 200,
          error: false,
          message: 'Autorização realizada com sucesso.',
          data: { token: 'downstream-token' }
        }
      }
    })

    const result = await client.validateAttestationToken('device-token', 'android')

    expect(result).toEqual({ accessToken: 'downstream-token' })
    expect(post).toHaveBeenCalledWith('/attestation', {
      agent: 'android',
      origemApp: 'detranconsultas',
      token: 'device-token'
    })
  })

  test('rejects with the upstream message on error (result aninhado dentro de result)', async () => {
    const { client, post } = build()
    post.mockResolvedValue({
      data: {
        result: {
          result: {
            statusCode: 400,
            error: true,
            message: 'Token inválido!',
            data: null
          }
        }
      }
    })

    await expect(client.validateAttestationToken('device-token', 'ios'))
      .rejects
      .toMatchObject({ status: 401, message: 'Token inválido!' })
  })

  test('rejects with a generic message when the response has no token at all', async () => {
    const { client, post } = build()
    post.mockResolvedValue({ data: {} })

    await expect(client.validateAttestationToken('device-token', 'android'))
      .rejects
      .toMatchObject({ status: 401, message: 'Token de atestação inválido ou expirado.' })
  })
})

// Confirmado em teste manual contra o ServiceNow real: a falha lógica não
// chega só como HTTP 200 + error:true no corpo (como a doc dava a entender) —
// também chega como um status HTTP não-2xx de fato (ex. 400), que o axios
// rejeita antes de o corpo passar pelo caminho de sucesso. buildAttestationError
// é a função usada pelo interceptor de erro nesse caso — testada direto aqui
// porque mockar `axios.post` (como acima) contorna a pipeline de interceptors
// por completo, então nunca exerceria esse caminho.
describe('buildAttestationError', () => {
  test('uses the upstream message from a real HTTP-level error response (result aninhado)', () => {
    const err = buildAttestationError({
      result: {
        result: {
          statusCode: 400,
          error: true,
          message: 'Token inválido!',
          data: null
        }
      }
    }) as Error & { status: number }

    expect(err).toMatchObject({ status: 401, message: 'Token inválido!' })
  })

  test('falls back to a generic 502 when there is no parseable body', () => {
    const err = buildAttestationError(undefined) as Error & { status: number }

    expect(err).toMatchObject({ status: 502, message: 'Não foi possível validar o token de atestação.' })
  })
})
