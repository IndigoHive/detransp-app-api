import { describe, expect, it, vi } from 'vitest'
import type { Logger } from 'pino'
import { DetranSpServiceNowDebRestrError } from '../../../clients/detran-sp-service-now-deb-restr'
import type { DetranSpServiceNowDebRestrClient } from '../../../clients/detran-sp-service-now-deb-restr'
import type { DetranSpServiceNowPgtoClient } from '../../../clients/detran-sp-service-now-pgto'
import type { IAnalyticsService } from '../../analytics'
import { ConsultaVeiculoDebitosService } from './consulta-veiculo-debitos-service'

function buildAnalytics (): IAnalyticsService {
  return { capture: vi.fn(), createInsertId: vi.fn(() => 'insert-id') }
}

function buildLogger (): Logger {
  return { warn: vi.fn(), info: vi.fn(), error: vi.fn() } as unknown as Logger
}

function buildAuth () {
  return { accessToken: 'token', userCpf: '12345678901', renavam: '123', placa: 'ABC1234' }
}

describe('ConsultaVeiculoDebitosService', () => {
  it('emite debitos:vehicle_query quando o veículo é encontrado', async () => {
    const debRestrClient = {
      buscaVeiculo: vi.fn().mockResolvedValue({ data: { attributes: {}, meta: {} }, included: [] })
    } as unknown as DetranSpServiceNowDebRestrClient
    const pgtoClient = {
      listaDebitos: vi.fn().mockResolvedValue(null)
    } as unknown as DetranSpServiceNowPgtoClient
    const analyticsService = buildAnalytics()

    const service = new ConsultaVeiculoDebitosService(debRestrClient, pgtoClient, buildLogger(), analyticsService)
    await service.run(buildAuth())

    expect(analyticsService.capture).toHaveBeenCalledTimes(1)
    expect(analyticsService.capture).toHaveBeenCalledWith('12345678901', 'debitos:vehicle_query')
  })

  it('não emite quando o limite diário de consultas por representação é atingido', async () => {
    const debRestrClient = {
      buscaVeiculo: vi.fn().mockRejectedValue(
        new DetranSpServiceNowDebRestrError('LimiteExcedidoError', 'limite diário atingido', undefined, 429)
      )
    } as unknown as DetranSpServiceNowDebRestrClient
    const pgtoClient = {
      listaDebitos: vi.fn().mockResolvedValue(null)
    } as unknown as DetranSpServiceNowPgtoClient
    const analyticsService = buildAnalytics()

    const service = new ConsultaVeiculoDebitosService(debRestrClient, pgtoClient, buildLogger(), analyticsService)
    const result = await service.run({ ...buildAuth(), representacao: true })

    expect(result.limitReached).toBe(true)
    expect(analyticsService.capture).not.toHaveBeenCalled()
  })

  it('não emite quando o veículo não é encontrado', async () => {
    const debRestrClient = {
      buscaVeiculo: vi.fn().mockResolvedValue({ data: null })
    } as unknown as DetranSpServiceNowDebRestrClient
    const pgtoClient = {
      listaDebitos: vi.fn().mockResolvedValue(null)
    } as unknown as DetranSpServiceNowPgtoClient
    const analyticsService = buildAnalytics()

    const service = new ConsultaVeiculoDebitosService(debRestrClient, pgtoClient, buildLogger(), analyticsService)
    const result = await service.run(buildAuth())

    expect(result.vehicle).toBeNull()
    expect(analyticsService.capture).not.toHaveBeenCalled()
  })
})
