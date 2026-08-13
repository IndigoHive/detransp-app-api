import { isHttpError } from 'http-errors'
import { describe, expect, it, vi } from 'vitest'
import { DetranSpServiceNowDebRestrError } from '../../../clients/detran-sp-service-now-deb-restr'
import type { DetranSpServiceNowDebRestrClient } from '../../../clients/detran-sp-service-now-deb-restr'
import { VerificaQRCodeCertidaoService } from './verifica-qr-code-certidao-service'

function buildAuth () {
  return { accessToken: 'token', userCpf: '12345678901', renavam: '123', placa: 'ABC1234' }
}

describe('VerificaQRCodeCertidaoService', () => {
  it('re-throws a real upstream 401 as Unauthorized instead of the client\'s genericized error', async () => {
    const client = {
      verificaQRCodeCertidao: vi.fn().mockRejectedValue(
        new DetranSpServiceNowDebRestrError('AuthenticationError', 'generic message', undefined, 401)
      )
    } as unknown as DetranSpServiceNowDebRestrClient
    const service = new VerificaQRCodeCertidaoService(client)

    await expect(service.run(buildAuth())).rejects.toMatchObject({ status: 401 })
  })

  it('leaves the client\'s genericized 422 untouched for non-401 upstream errors', async () => {
    const client = {
      verificaQRCodeCertidao: vi.fn().mockRejectedValue(
        new DetranSpServiceNowDebRestrError('SomeBusinessError', 'generic message', undefined, 500)
      )
    } as unknown as DetranSpServiceNowDebRestrClient
    const service = new VerificaQRCodeCertidaoService(client)

    const err = await service.run(buildAuth()).catch((e) => e)
    expect(isHttpError(err)).toBe(false)
    expect(err).toBeInstanceOf(DetranSpServiceNowDebRestrError)
  })
})
