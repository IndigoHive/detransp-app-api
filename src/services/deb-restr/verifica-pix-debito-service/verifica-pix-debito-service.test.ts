import { isHttpError } from 'http-errors'
import { describe, expect, it, vi } from 'vitest'
import { DetranSpServiceNowPgtoError } from '../../../clients/detran-sp-service-now-pgto'
import type { DetranSpServiceNowPgtoClient } from '../../../clients/detran-sp-service-now-pgto'
import { VerificaPixDebitoService } from './verifica-pix-debito-service'

function buildAuth () {
  return { accessToken: 'token', userCpf: '12345678901', renavam: '123', placa: 'ABC1234', idSolServico: 'sol-1' }
}

describe('VerificaPixDebitoService', () => {
  it('re-throws a real upstream 401 as Unauthorized instead of the client\'s genericized error', async () => {
    const client = {
      verificaPix: vi.fn().mockRejectedValue(
        new DetranSpServiceNowPgtoError('AuthenticationError', 'generic message', undefined, 401)
      )
    } as unknown as DetranSpServiceNowPgtoClient
    const service = new VerificaPixDebitoService(client)

    await expect(service.run(buildAuth())).rejects.toMatchObject({ status: 401 })
  })

  it('leaves the client\'s genericized 422 untouched for non-401 upstream errors', async () => {
    const client = {
      verificaPix: vi.fn().mockRejectedValue(
        new DetranSpServiceNowPgtoError('SomeBusinessError', 'generic message', undefined, 500)
      )
    } as unknown as DetranSpServiceNowPgtoClient
    const service = new VerificaPixDebitoService(client)

    const err = await service.run(buildAuth()).catch((e) => e)
    expect(isHttpError(err)).toBe(false)
    expect(err).toBeInstanceOf(DetranSpServiceNowPgtoError)
  })

  it('propagates errors unrelated to the pgto client as-is', async () => {
    const client = {
      verificaPix: vi.fn().mockRejectedValue(new Error('boom'))
    } as unknown as DetranSpServiceNowPgtoClient
    const service = new VerificaPixDebitoService(client)

    await expect(service.run(buildAuth())).rejects.toThrow('boom')
  })
})
