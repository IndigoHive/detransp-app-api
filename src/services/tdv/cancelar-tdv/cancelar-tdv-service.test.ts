import { describe, expect, it, vi } from 'vitest'
import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { CodigoEstadoTDV } from '../../../clients/detran-sp-service-now/tdv/types'
import { CancelarTdvService } from './cancelar-tdv-service'
import type { IAnalyticsService } from '../../../services/analytics'

function buildAnalytics (): IAnalyticsService {
  return { capture: vi.fn(), createInsertId: vi.fn(() => 'insert-id') }
}


const cpf = '12345678901'
const authHeader = `Bearer header.${Buffer.from(JSON.stringify({ preferred_username: cpf })).toString('base64url')}.sig`
const clientAuth = { token: authHeader.replace(/^Bearer\s+/i, ''), cpf }

function asClient (client: Partial<DetranSpServiceNowTdvClient>): DetranSpServiceNowTdvClient {
  return client as DetranSpServiceNowTdvClient
}

describe('CancelarTdvService', () => {
  it('cancels an active TDV', async () => {
    const buscaTdv = vi.fn().mockResolvedValue({ result: { estado: CodigoEstadoTDV.ATPVE_CRIADA } })
    const atualizaTdv = vi.fn().mockResolvedValue({ result: {} })
    const service = new CancelarTdvService({ detranSpServiceNowTdv: asClient({ buscaTdv, atualizaTdv }), analyticsService: buildAnalytics() })

    await expect(service.run(authHeader, { codigoTransferencia: 'TDV-1' }))
      .resolves.toEqual({ success: true })

    expect(atualizaTdv).toHaveBeenCalledWith(clientAuth, 'TDV-1', {
      estado: CodigoEstadoTDV.TRANSFERENCIA_CANCELADA,
      ativa: 'false'
    })
  })

  it('is a no-op when the comunicação de venda has no TDV behind it yet', async () => {
    const buscaTdv = vi.fn()
    const atualizaTdv = vi.fn()
    const service = new CancelarTdvService({ detranSpServiceNowTdv: asClient({ buscaTdv, atualizaTdv }), analyticsService: buildAnalytics() })

    await expect(service.run(authHeader, { codigoTransferencia: '  ' }))
      .resolves.toEqual({ success: true })

    expect(buscaTdv).not.toHaveBeenCalled()
    expect(atualizaTdv).not.toHaveBeenCalled()
  })

  it('does not cancel twice', async () => {
    const buscaTdv = vi.fn().mockResolvedValue({
      result: { estado: CodigoEstadoTDV.TRANSFERENCIA_CANCELADA }
    })
    const atualizaTdv = vi.fn()
    const service = new CancelarTdvService({ detranSpServiceNowTdv: asClient({ buscaTdv, atualizaTdv }), analyticsService: buildAnalytics() })

    await expect(service.run(authHeader, { codigoTransferencia: 'TDV-1' }))
      .resolves.toEqual({ success: true })

    expect(atualizaTdv).not.toHaveBeenCalled()
  })
})
