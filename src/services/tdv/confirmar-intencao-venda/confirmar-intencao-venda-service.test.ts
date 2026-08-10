import { describe, expect, it, vi } from 'vitest'
import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { ConfirmarIntencaoVendaService } from './confirmar-intencao-venda-service'

const authorizationHeader = 'Bearer eyJhbGciOiJub25lIn0.eyJwcmVmZXJyZWRfdXNlcm5hbWUiOiIwNTI0NjQ4NzYwMSJ9.'

function asClient (client: Partial<DetranSpServiceNowTdvClient>): DetranSpServiceNowTdvClient {
  return client as DetranSpServiceNowTdvClient
}

describe('ConfirmarIntencaoVendaService', () => {
  it('advances the TDV to state 3 (ATPVE_CRIADA) when it is currently at state 2', async () => {
    const buscaTdv = vi.fn().mockResolvedValue({ result: { estado: '2' } })
    const atualizaTdv = vi.fn().mockResolvedValue({ result: {} })
    const service = new ConfirmarIntencaoVendaService({ detranSpServiceNowTdv: asClient({ buscaTdv, atualizaTdv }) })

    await expect(service.run(authorizationHeader, {
      codigoTransferencia: 'TDV-1',
      codigoProvaVidaVendedor: 'liveness-123'
    })).resolves.toEqual({})

    expect(atualizaTdv).toHaveBeenCalledWith(
      { token: expect.any(String), cpf: '05246487601' },
      'TDV-1',
      { estado: '3', codigoProvaVidaVendedor: 'liveness-123', tipoProvaVidaVendedor: '2' }
    )
  })

  it('is idempotent — skips the mutation when the TDV already moved past DADOS_VENDA_INFORMADOS', async () => {
    const buscaTdv = vi.fn().mockResolvedValue({ result: { estado: '3' } })
    const atualizaTdv = vi.fn()
    const service = new ConfirmarIntencaoVendaService({ detranSpServiceNowTdv: asClient({ buscaTdv, atualizaTdv }) })

    await expect(service.run(authorizationHeader, {
      codigoTransferencia: 'TDV-1',
      codigoProvaVidaVendedor: 'liveness-123'
    })).resolves.toEqual({})

    expect(atualizaTdv).not.toHaveBeenCalled()
  })

  it('is idempotent — skips the mutation when the TDV is still at state 1 (out of order call)', async () => {
    const buscaTdv = vi.fn().mockResolvedValue({ result: { estado: '1' } })
    const atualizaTdv = vi.fn()
    const service = new ConfirmarIntencaoVendaService({ detranSpServiceNowTdv: asClient({ buscaTdv, atualizaTdv }) })

    await expect(service.run(authorizationHeader, {
      codigoTransferencia: 'TDV-1',
      codigoProvaVidaVendedor: 'liveness-123'
    })).resolves.toEqual({})

    expect(atualizaTdv).not.toHaveBeenCalled()
  })
})
