import { describe, expect, it, vi } from 'vitest'
import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { InformarDadosVendaService } from './informar-dados-venda-service'

const authorizationHeader = 'Bearer eyJhbGciOiJub25lIn0.eyJwcmVmZXJyZWRfdXNlcm5hbWUiOiIwNTI0NjQ4NzYwMSJ9.'

const input = {
  codigoTransferencia: 'TDV-1',
  cpfComprador: '11111111111',
  nomeComprador: 'Maria Compradora',
  emailComprador: 'maria@example.com',
  cepComprador: '01310100',
  numeroComprador: '100',
  complementoComprador: 'Apto 1',
  valorVenda: '30000',
  quilometragem: '50000',
  codigoProvaVidaVendedor: 'liveness-123'
}

function asClient (client: Partial<DetranSpServiceNowTdvClient>): DetranSpServiceNowTdvClient {
  return client as DetranSpServiceNowTdvClient
}

describe('InformarDadosVendaService', () => {
  it('advances the TDV to state 2 (DADOS_VENDA_INFORMADOS) with buyer + sale data', async () => {
    const buscaTdv = vi.fn().mockResolvedValue({ result: { estado: '1', kmVistoriadaVeiculo: '40000' } })
    const buscaEndereco = vi.fn().mockResolvedValue({ result: { bairro: 'Centro', logradouro: 'Rua A' } })
    const atualizaTdv = vi.fn().mockResolvedValue({ result: {} })
    const service = new InformarDadosVendaService({ detranSpServiceNowTdv: asClient({ buscaTdv, buscaEndereco, atualizaTdv }) })

    await expect(service.run(authorizationHeader, input)).resolves.toEqual({})

    expect(atualizaTdv).toHaveBeenCalledWith(
      { token: expect.any(String), cpf: '05246487601' },
      'TDV-1',
      expect.objectContaining({
        estado: '2',
        codigoComprador: '11111111111',
        valorVendaVeiculo: '30000',
        kmVeiculo: '50000',
        bairroComprador: 'Centro',
        codigoProvaVidaVendedor: 'liveness-123'
      })
    )
  })

  it('is idempotent — skips the mutation when the TDV already moved past VEICULO_SELECIONADO', async () => {
    const buscaTdv = vi.fn().mockResolvedValue({ result: { estado: '2', kmVistoriadaVeiculo: '40000' } })
    const buscaEndereco = vi.fn()
    const atualizaTdv = vi.fn()
    const service = new InformarDadosVendaService({ detranSpServiceNowTdv: asClient({ buscaTdv, buscaEndereco, atualizaTdv }) })

    await expect(service.run(authorizationHeader, input)).resolves.toEqual({})

    expect(atualizaTdv).not.toHaveBeenCalled()
    expect(buscaEndereco).not.toHaveBeenCalled()
  })

  it('rejects when the vehicle has never been vistoriado', async () => {
    const buscaTdv = vi.fn().mockResolvedValue({ result: {} })
    const atualizaTdv = vi.fn()
    const service = new InformarDadosVendaService({ detranSpServiceNowTdv: asClient({ buscaTdv, atualizaTdv }) })

    await expect(service.run(authorizationHeader, input)).rejects.toThrow('vistoriado')
    expect(atualizaTdv).not.toHaveBeenCalled()
  })

  it('rejects when the submitted mileage is lower than the vistoria mileage', async () => {
    const buscaTdv = vi.fn().mockResolvedValue({ result: { kmVistoriadaVeiculo: '90000' } })
    const atualizaTdv = vi.fn()
    const service = new InformarDadosVendaService({ detranSpServiceNowTdv: asClient({ buscaTdv, atualizaTdv }) })

    await expect(service.run(authorizationHeader, input)).rejects.toThrow('quilometragem')
    expect(atualizaTdv).not.toHaveBeenCalled()
  })
})
