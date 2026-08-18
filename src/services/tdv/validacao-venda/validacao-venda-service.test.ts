import { describe, expect, it, vi } from 'vitest'
import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import type { Config } from '../../../types'
import { ValidacaoVendaService } from './validacao-venda-service'

const authorizationHeader = 'Bearer eyJhbGciOiJub25lIn0.eyJwcmVmZXJyZWRfdXNlcm5hbWUiOiIwNTI0NjQ4NzYwMSJ9.'

const input = {
  placaVeiculo: 'ABC1D23',
  renavamVeiculo: '00001002003',
  cpfComprador: '11122233344',
  cepComprador: '08060283',
  valorVenda: '30000',
  quilometragem: '10000'
}

function asClient (client: Partial<DetranSpServiceNowTdvClient>): DetranSpServiceNowTdvClient {
  return client as DetranSpServiceNowTdvClient
}

function asConfig (tdvMock: Partial<Config['tdvMock']> = {}): Config {
  return {
    tdvMock: {
      forceVehicleRestriction: false,
      forceCidadesDiferentes: false,
      ...tdvMock
    }
  } as Config
}

describe('ValidacaoVendaService', () => {
  it('returns false when the vehicle is not found among the owner\'s vehicles', async () => {
    const listaVeiculosProprietario = vi.fn().mockResolvedValue({ result: [] })
    const buscaEndereco = vi.fn()
    const service = new ValidacaoVendaService({
      detranSpServiceNowTdv: asClient({ listaVeiculosProprietario, buscaEndereco }),
      config: asConfig()
    })

    await expect(service.run(authorizationHeader, input)).resolves.toEqual({ cidadesDiferentes: false })
    expect(buscaEndereco).not.toHaveBeenCalled()
  })

  it('returns false without checking cities when the plate is already Mercosul', async () => {
    const listaVeiculosProprietario = vi.fn().mockResolvedValue({
      result: [{ placa: 'ABC1D23', placaMercosul: 'true', nomeMunicipio: 'São Paulo' }]
    })
    const buscaEndereco = vi.fn()
    const service = new ValidacaoVendaService({
      detranSpServiceNowTdv: asClient({ listaVeiculosProprietario, buscaEndereco }),
      config: asConfig()
    })

    await expect(service.run(authorizationHeader, input)).resolves.toEqual({ cidadesDiferentes: false })
    expect(buscaEndereco).not.toHaveBeenCalled()
  })

  it('returns true when the vehicle and buyer municipalities differ', async () => {
    const listaVeiculosProprietario = vi.fn().mockResolvedValue({
      result: [{ placa: 'ABC1D23', placaMercosul: 'false', nomeMunicipio: 'São Paulo' }]
    })
    const buscaEndereco = vi.fn().mockResolvedValue({ result: { municipio: 'Santos' } })
    const service = new ValidacaoVendaService({
      detranSpServiceNowTdv: asClient({ listaVeiculosProprietario, buscaEndereco }),
      config: asConfig()
    })

    await expect(service.run(authorizationHeader, input)).resolves.toEqual({ cidadesDiferentes: true })
  })

  it('returns false when the vehicle and buyer municipalities match', async () => {
    const listaVeiculosProprietario = vi.fn().mockResolvedValue({
      result: [{ placa: 'ABC1D23', placaMercosul: 'false', nomeMunicipio: 'São Paulo' }]
    })
    const buscaEndereco = vi.fn().mockResolvedValue({ result: { municipio: 'São Paulo' } })
    const service = new ValidacaoVendaService({
      detranSpServiceNowTdv: asClient({ listaVeiculosProprietario, buscaEndereco }),
      config: asConfig()
    })

    await expect(service.run(authorizationHeader, input)).resolves.toEqual({ cidadesDiferentes: false })
  })

  it('returns true without hitting the client when forceCidadesDiferentes is on', async () => {
    const listaVeiculosProprietario = vi.fn()
    const service = new ValidacaoVendaService({
      detranSpServiceNowTdv: asClient({ listaVeiculosProprietario }),
      config: asConfig({ forceCidadesDiferentes: true })
    })

    await expect(service.run(authorizationHeader, input)).resolves.toEqual({ cidadesDiferentes: true })
    expect(listaVeiculosProprietario).not.toHaveBeenCalled()
  })
})
