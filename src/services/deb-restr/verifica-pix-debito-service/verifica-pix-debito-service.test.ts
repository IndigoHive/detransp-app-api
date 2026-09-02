import { isHttpError } from 'http-errors'
import { describe, expect, it, vi } from 'vitest'
import { DetranSpServiceNowPgtoError } from '../../../clients/detran-sp-service-now-pgto'
import type { DetranSpServiceNowPgtoClient } from '../../../clients/detran-sp-service-now-pgto'
import { VerificaPixDebitoService } from './verifica-pix-debito-service'
import type { IAnalyticsService } from '../../analytics'

function buildAnalytics (): IAnalyticsService {
  return { capture: vi.fn(), createInsertId: vi.fn(() => 'insert-id') }
}

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
    const service = new VerificaPixDebitoService(client, buildAnalytics())

    await expect(service.run(buildAuth())).rejects.toMatchObject({ status: 401 })
  })

  it('leaves the client\'s genericized 422 untouched for non-401 upstream errors', async () => {
    const client = {
      verificaPix: vi.fn().mockRejectedValue(
        new DetranSpServiceNowPgtoError('SomeBusinessError', 'generic message', undefined, 500)
      )
    } as unknown as DetranSpServiceNowPgtoClient
    const service = new VerificaPixDebitoService(client, buildAnalytics())

    const err = await service.run(buildAuth()).catch((e) => e)
    expect(isHttpError(err)).toBe(false)
    expect(err).toBeInstanceOf(DetranSpServiceNowPgtoError)
  })

  it('propagates errors unrelated to the pgto client as-is', async () => {
    const client = {
      verificaPix: vi.fn().mockRejectedValue(new Error('boom'))
    } as unknown as DetranSpServiceNowPgtoClient
    const service = new VerificaPixDebitoService(client, buildAnalytics())

    await expect(service.run(buildAuth())).rejects.toThrow('boom')
  })
  // Este endpoint é polado pelo app a cada ~5s. Sem o guard de estado, cada poll depois do
  // pagamento viraria um evento e debitos:pix_pay dominaria o volume do projeto.
  it('não emite debitos:pix_pay enquanto o PIX não foi pago', async () => {
    const client = {
      verificaPix: vi.fn().mockResolvedValue({
        included: [{ type: 'qr-code', attributes: { estadoQRCode: '1' } }]
      })
    } as unknown as DetranSpServiceNowPgtoClient
    const analyticsService = buildAnalytics()

    const result = await new VerificaPixDebitoService(client, analyticsService).run(buildAuth())

    expect(result.estado).toBe(1)
    expect(analyticsService.capture).not.toHaveBeenCalled()
  })

  it('emite debitos:pix_pay uma vez quando pago, com $insert_id derivado do idSolServico', async () => {
    const client = {
      verificaPix: vi.fn().mockResolvedValue({
        included: [{ type: 'qr-code', attributes: { estadoQRCode: '2' } }]
      })
    } as unknown as DetranSpServiceNowPgtoClient
    const analyticsService = buildAnalytics()

    await new VerificaPixDebitoService(client, analyticsService).run(buildAuth())

    expect(analyticsService.capture).toHaveBeenCalledTimes(1)
    expect(analyticsService.capture).toHaveBeenCalledWith(
      '12345678901', 'debitos:pix_pay', { $insert_id: 'insert-id' }
    )
    // a chave de dedupe tem que sair do id da cobrança, não de algo volátil
    expect(analyticsService.createInsertId).toHaveBeenCalledWith('debitos:pix_pay:sol-1')
  })
})
