import { describe, expect, it, vi } from 'vitest'
import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import type { IAnalyticsService } from '../../analytics'
import { ValidaAssinaturaService } from './valida-assinatura-service'

const authorizationHeader = 'Bearer eyJhbGciOiJub25lIn0.eyJwcmVmZXJyZWRfdXNlcm5hbWUiOiIwNTI0NjQ4NzYwMSJ9.'
const sellerCpf = '05246487601'
const itiCode = 'OC-test-code'
const clientAuth = { token: expect.any(String), cpf: sellerCpf }

function asClient (client: Partial<DetranSpServiceNowTdvClient>): DetranSpServiceNowTdvClient {
  return client as DetranSpServiceNowTdvClient
}

function buildAnalytics (): IAnalyticsService {
  return { capture: vi.fn(), createInsertId: vi.fn() }
}

describe('ValidaAssinaturaService', () => {
  it('advances the TDV 1.0 seller from estado 6 to 7 with the ITI code', async () => {
    const buscaTdv = vi.fn().mockResolvedValue({
      result: { estado: '6', origem: '1', codigoVendedor: sellerCpf }
    })
    const atualizaTdv = vi.fn().mockResolvedValue({ result: {} })
    const service = new ValidaAssinaturaService({ detranSpServiceNowTdv: asClient({ buscaTdv, atualizaTdv }), analyticsService: buildAnalytics() })

    await expect(service.run(authorizationHeader, {
      codigoTransferencia: 'TDV-1',
      itiCode
    })).resolves.toEqual({ valid: true })

    expect(atualizaTdv).toHaveBeenCalledWith(clientAuth, 'TDV-1', {
      estado: '7',
      itiCode
    })
  })

  it('advances origem 5 seller from estado 2 to 7 and does not jump to 8', async () => {
    const buscaTdv = vi.fn().mockResolvedValue({
      result: { estado: '2', origem: '5', codigoVendedor: sellerCpf }
    })
    const atualizaTdv = vi.fn().mockResolvedValue({ result: {} })
    const service = new ValidaAssinaturaService({ detranSpServiceNowTdv: asClient({ buscaTdv, atualizaTdv }), analyticsService: buildAnalytics() })

    await expect(service.run(authorizationHeader, {
      codigoTransferencia: 'TDV-LOJA',
      itiCode
    })).resolves.toEqual({ valid: true })

    expect(atualizaTdv).toHaveBeenCalledTimes(1)
    expect(atualizaTdv).toHaveBeenCalledWith(clientAuth, 'TDV-LOJA', {
      estado: '7',
      itiCode
    })
  })

  it('advances origem 5 seller from estado 1 to 7', async () => {
    const buscaTdv = vi.fn().mockResolvedValue({
      result: { estado: '1', origem: '5', codigoVendedor: sellerCpf }
    })
    const atualizaTdv = vi.fn().mockResolvedValue({ result: {} })
    const service = new ValidaAssinaturaService({ detranSpServiceNowTdv: asClient({ buscaTdv, atualizaTdv }), analyticsService: buildAnalytics() })

    await expect(service.run(authorizationHeader, {
      codigoTransferencia: 'TDV-LOJA',
      itiCode
    })).resolves.toEqual({ valid: true })

    expect(atualizaTdv).toHaveBeenCalledWith(clientAuth, 'TDV-LOJA', {
      estado: '7',
      itiCode
    })
  })

  it('advances origem 5 seller from estado 6 to 7 with the ITI code', async () => {
    const buscaTdv = vi.fn().mockResolvedValue({
      result: { estado: '6', origem: '5', codigoVendedor: sellerCpf }
    })
    const atualizaTdv = vi.fn().mockResolvedValue({ result: {} })
    const service = new ValidaAssinaturaService({ detranSpServiceNowTdv: asClient({ buscaTdv, atualizaTdv }), analyticsService: buildAnalytics() })

    await expect(service.run(authorizationHeader, {
      codigoTransferencia: 'TDV-LOJA',
      itiCode
    })).resolves.toEqual({ valid: true })

    expect(atualizaTdv).toHaveBeenCalledTimes(1)
    expect(atualizaTdv).toHaveBeenCalledWith(clientAuth, 'TDV-LOJA', {
      estado: '7',
      itiCode
    })
  })

  it('does not PATCH origem 1 seller when estado is 2 (buyer has not signed yet)', async () => {
    const buscaTdv = vi.fn().mockResolvedValue({
      result: { estado: '2', origem: '1', codigoVendedor: sellerCpf }
    })
    const atualizaTdv = vi.fn()
    const service = new ValidaAssinaturaService({ detranSpServiceNowTdv: asClient({ buscaTdv, atualizaTdv }), analyticsService: buildAnalytics() })

    await expect(service.run(authorizationHeader, {
      codigoTransferencia: 'TDV-1',
      itiCode
    })).resolves.toEqual({ valid: false })

    expect(atualizaTdv).not.toHaveBeenCalled()
  })

  it('is idempotent for origem 5 seller already at estado 7', async () => {
    const buscaTdv = vi.fn().mockResolvedValue({
      result: { estado: '7', origem: '5', codigoVendedor: sellerCpf }
    })
    const atualizaTdv = vi.fn()
    const service = new ValidaAssinaturaService({ detranSpServiceNowTdv: asClient({ buscaTdv, atualizaTdv }), analyticsService: buildAnalytics() })

    await expect(service.run(authorizationHeader, {
      codigoTransferencia: 'TDV-LOJA',
      itiCode
    })).resolves.toEqual({ valid: true })

    expect(atualizaTdv).not.toHaveBeenCalled()
  })

  it('advances the buyer from estado 5 to 6 with the ITI code', async () => {
    const buscaTdv = vi.fn().mockResolvedValue({
      result: { estado: '5', origem: '1', codigoVendedor: '11111111111' }
    })
    const atualizaTdv = vi.fn().mockResolvedValue({ result: {} })
    const service = new ValidaAssinaturaService({ detranSpServiceNowTdv: asClient({ buscaTdv, atualizaTdv }), analyticsService: buildAnalytics() })

    await expect(service.run(authorizationHeader, {
      codigoTransferencia: 'TDV-1',
      itiCode
    })).resolves.toEqual({ valid: true })

    expect(atualizaTdv).toHaveBeenCalledWith(clientAuth, 'TDV-1', {
      estado: '6',
      itiCode
    })
  })
})
