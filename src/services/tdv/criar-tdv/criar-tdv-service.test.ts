import { describe, expect, it, vi } from 'vitest'
import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { CriarTdvService } from './criar-tdv-service'

const authorizationHeader = 'Bearer eyJhbGciOiJub25lIn0.eyJwcmVmZXJyZWRfdXNlcm5hbWUiOiIwNTI0NjQ4NzYwMSIsIm5hbWUiOiJKb8OjbyBEZXRyYW4iLCJlbWFpbCI6ImpvYW9AZXhhbXBsZS5jb20ifQ.'

const input = { placaVeiculo: 'ABC1D23', renavamVeiculo: '00001002003' }

const createdTdv = {
  estado: '1',
  codigoTransferenciaVeiculo: 'TDV-NEW',
  placaVeiculo: 'ABC1D23',
  codigoRenavamVeiculo: '00001002003',
  origem: '5'
}

function asClient (client: Partial<DetranSpServiceNowTdvClient>): DetranSpServiceNowTdvClient {
  return client as DetranSpServiceNowTdvClient
}

describe('CriarTdvService', () => {
  it('creates a new TDV when none is active for the vehicle yet and reads origem from the list', async () => {
    const listaTdvs = vi.fn()
      .mockResolvedValueOnce({ result: [] })
      .mockResolvedValueOnce({ result: [createdTdv] })
    const criaTdv = vi.fn().mockResolvedValue({ result: { codigoTransferenciaVeiculo: 'TDV-NEW' } })
    const service = new CriarTdvService({ detranSpServiceNowTdv: asClient({ listaTdvs, criaTdv }) })

    await expect(service.run(authorizationHeader, input)).resolves.toEqual({ codigo: 'TDV-NEW', origem: '5' })
    expect(criaTdv).toHaveBeenCalledWith(
      { token: expect.any(String), cpf: '05246487601' },
      expect.objectContaining({ placaVeiculo: 'ABC1D23', codigoRenavamVeiculo: '00001002003', codigoVendedor: '05246487601' })
    )
    expect(listaTdvs).toHaveBeenCalledTimes(2)
  })

  it('matches the created TDV by RENAVAM when plate is missing from the list', async () => {
    const listaTdvs = vi.fn()
      .mockResolvedValueOnce({ result: [] })
      .mockResolvedValueOnce({
        result: [{
          estado: '1',
          codigoTransferenciaVeiculo: 'TDV-NEW',
          codigoRenavamVeiculo: '00001002003',
          origem: '1'
        }]
      })
    const criaTdv = vi.fn().mockResolvedValue({ result: { codigoTransferenciaVeiculo: 'TDV-NEW' } })
    const service = new CriarTdvService({ detranSpServiceNowTdv: asClient({ listaTdvs, criaTdv }) })

    await expect(service.run(authorizationHeader, input)).resolves.toEqual({ codigo: 'TDV-NEW', origem: '1' })
  })

  it('reuses an existing active TDV for the same vehicle instead of creating a duplicate', async () => {
    const listaTdvs = vi.fn().mockResolvedValue({
      result: [{ estado: '2', codigoTransferenciaVeiculo: 'TDV-EXISTING', origem: '5' }]
    })
    const criaTdv = vi.fn()
    const service = new CriarTdvService({ detranSpServiceNowTdv: asClient({ listaTdvs, criaTdv }) })

    await expect(service.run(authorizationHeader, input)).resolves.toEqual({ codigo: 'TDV-EXISTING', origem: '5' })
    expect(criaTdv).not.toHaveBeenCalled()
    expect(listaTdvs).toHaveBeenCalledTimes(1)
  })

  it('ignores cancelled TDVs when looking for one to reuse', async () => {
    const listaTdvs = vi.fn()
      .mockResolvedValueOnce({
        result: [{ estado: '10', codigoTransferenciaVeiculo: 'TDV-CANCELLED' }]
      })
      .mockResolvedValueOnce({ result: [createdTdv] })
    const criaTdv = vi.fn().mockResolvedValue({ result: { codigoTransferenciaVeiculo: 'TDV-NEW' } })
    const service = new CriarTdvService({ detranSpServiceNowTdv: asClient({ listaTdvs, criaTdv }) })

    await expect(service.run(authorizationHeader, input)).resolves.toEqual({ codigo: 'TDV-NEW', origem: '5' })
    expect(criaTdv).toHaveBeenCalled()
  })

  it('still returns the created codigo when the follow-up list fails', async () => {
    const listaTdvs = vi.fn()
      .mockResolvedValueOnce({ result: [] })
      .mockRejectedValueOnce(new Error('listaTdvs unavailable'))
    const criaTdv = vi.fn().mockResolvedValue({ result: { codigoTransferenciaVeiculo: 'TDV-NEW' } })
    const service = new CriarTdvService({ detranSpServiceNowTdv: asClient({ listaTdvs, criaTdv }) })

    await expect(service.run(authorizationHeader, input)).resolves.toEqual({ codigo: 'TDV-NEW' })
  })
})
