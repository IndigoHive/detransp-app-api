import { describe, expect, it, vi } from 'vitest'
import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { ValidarKmService } from './validar-km-service'

const authorizationHeader = 'Bearer eyJhbGciOiJub25lIn0.eyJwcmVmZXJyZWRfdXNlcm5hbWUiOiIwNTI0NjQ4NzYwMSJ9.'

const input = { codigoTransferencia: 'TDV-1', quilometragem: '50000' }

function asClient (client: Partial<DetranSpServiceNowTdvClient>): DetranSpServiceNowTdvClient {
  return client as DetranSpServiceNowTdvClient
}

describe('ValidarKmService', () => {
  it('accepts mileage greater than or equal to the vistoria mileage', async () => {
    const buscaTdv = vi.fn().mockResolvedValue({ result: { kmVistoriadaVeiculo: '40000' } })
    const atualizaTdv = vi.fn()
    const service = new ValidarKmService({ detranSpServiceNowTdv: asClient({ buscaTdv, atualizaTdv }) })

    await expect(service.run(authorizationHeader, input)).resolves.toEqual({ valid: true })
    expect(atualizaTdv).not.toHaveBeenCalled()
  })

  it('rejects mileage lower than the vistoria mileage', async () => {
    const buscaTdv = vi.fn().mockResolvedValue({ result: { kmVistoriadaVeiculo: '90000' } })
    const atualizaTdv = vi.fn()
    const service = new ValidarKmService({ detranSpServiceNowTdv: asClient({ buscaTdv, atualizaTdv }) })

    await expect(service.run(authorizationHeader, input)).rejects.toThrow('quilometragem')
    expect(atualizaTdv).not.toHaveBeenCalled()
  })

  it('rejects when the vehicle has never been vistoriado', async () => {
    const buscaTdv = vi.fn().mockResolvedValue({ result: {} })
    const service = new ValidarKmService({ detranSpServiceNowTdv: asClient({ buscaTdv }) })

    await expect(service.run(authorizationHeader, input)).rejects.toThrow('vistoriado')
  })
})
