import { describe, expect, it, vi } from 'vitest'
import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { CriarTdvService } from './criar-tdv-service'

const authorizationHeader = 'Bearer eyJhbGciOiJub25lIn0.eyJwcmVmZXJyZWRfdXNlcm5hbWUiOiIwNTI0NjQ4NzYwMSIsIm5hbWUiOiJKb8OjbyBEZXRyYW4iLCJlbWFpbCI6ImpvYW9AZXhhbXBsZS5jb20ifQ.'

const input = { placaVeiculo: 'ABC1D23', renavamVeiculo: '00001002003' }

function asClient (client: Partial<DetranSpServiceNowTdvClient>): DetranSpServiceNowTdvClient {
  return client as DetranSpServiceNowTdvClient
}

describe('CriarTdvService', () => {
  it('creates a new TDV when none is active for the vehicle yet', async () => {
    const listaTdvs = vi.fn().mockResolvedValue({ result: [] })
    const criaTdv = vi.fn().mockResolvedValue({ result: { codigoTransferenciaVeiculo: 'TDV-NEW' } })
    const service = new CriarTdvService({ detranSpServiceNowTdv: asClient({ listaTdvs, criaTdv }) })

    await expect(service.run(authorizationHeader, input)).resolves.toEqual({ codigo: 'TDV-NEW' })
    expect(criaTdv).toHaveBeenCalledWith(
      { token: expect.any(String), cpf: '05246487601' },
      expect.objectContaining({ placaVeiculo: 'ABC1D23', codigoRenavamVeiculo: '00001002003', codigoVendedor: '05246487601' })
    )
  })

  it('reuses an existing active TDV for the same vehicle instead of creating a duplicate', async () => {
    const listaTdvs = vi.fn().mockResolvedValue({
      result: [{ estado: '2', codigoTransferenciaVeiculo: 'TDV-EXISTING' }]
    })
    const criaTdv = vi.fn()
    const service = new CriarTdvService({ detranSpServiceNowTdv: asClient({ listaTdvs, criaTdv }) })

    await expect(service.run(authorizationHeader, input)).resolves.toEqual({ codigo: 'TDV-EXISTING' })
    expect(criaTdv).not.toHaveBeenCalled()
  })

  it('ignores cancelled TDVs when looking for one to reuse', async () => {
    const listaTdvs = vi.fn().mockResolvedValue({
      result: [{ estado: '10', codigoTransferenciaVeiculo: 'TDV-CANCELLED' }]
    })
    const criaTdv = vi.fn().mockResolvedValue({ result: { codigoTransferenciaVeiculo: 'TDV-NEW' } })
    const service = new CriarTdvService({ detranSpServiceNowTdv: asClient({ listaTdvs, criaTdv }) })

    await expect(service.run(authorizationHeader, input)).resolves.toEqual({ codigo: 'TDV-NEW' })
    expect(criaTdv).toHaveBeenCalled()
  })
})
