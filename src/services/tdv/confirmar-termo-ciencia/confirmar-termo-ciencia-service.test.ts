import { describe, expect, it, vi } from 'vitest'
import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { ConfirmarTermoCienciaService } from './confirmar-termo-ciencia-service'

const authorizationHeader = 'Bearer eyJhbGciOiJub25lIn0.eyJwcmVmZXJyZWRfdXNlcm5hbWUiOiIwNTI0NjQ4NzYwMSJ9.'
const clientAuth = { token: expect.any(String), cpf: '05246487601' }

function asClient (client: Partial<DetranSpServiceNowTdvClient>): DetranSpServiceNowTdvClient {
  return client as DetranSpServiceNowTdvClient
}

describe('ConfirmarTermoCienciaService', () => {
  it('confirms the TCR on origem 5 and advances to estado 6', async () => {
    const buscaTdv = vi.fn().mockResolvedValue({
      result: { estado: '2', origem: '5', confirmacaoTermoCienciaResponsabilidade: '0' }
    })
    const atualizaTdv = vi.fn().mockResolvedValue({ result: {} })
    const service = new ConfirmarTermoCienciaService({ detranSpServiceNowTdv: asClient({ buscaTdv, atualizaTdv }) })

    await expect(service.run(authorizationHeader, {
      codigoTransferencia: 'TDV-LOJA'
    })).resolves.toEqual({})

    expect(atualizaTdv).toHaveBeenCalledWith(clientAuth, 'TDV-LOJA', {
      estado: '6',
      confirmacaoTermoCienciaResponsabilidade: true
    })
  })

  it('confirms the TCR when origem 5 is already at estado 6 without the document', async () => {
    const buscaTdv = vi.fn().mockResolvedValue({
      result: { estado: '6', origem: '5', confirmacaoTermoCienciaResponsabilidade: '0', codigoAnexoTermoCienciaResponsabilidade: null }
    })
    const atualizaTdv = vi.fn().mockResolvedValue({ result: {} })
    const service = new ConfirmarTermoCienciaService({ detranSpServiceNowTdv: asClient({ buscaTdv, atualizaTdv }) })

    await expect(service.run(authorizationHeader, {
      codigoTransferencia: 'TDV-LOJA'
    })).resolves.toEqual({})

    expect(atualizaTdv).toHaveBeenCalledWith(clientAuth, 'TDV-LOJA', {
      estado: '6',
      confirmacaoTermoCienciaResponsabilidade: true
    })
  })

  it('is idempotent when the TCR is already confirmed', async () => {
    const buscaTdv = vi.fn().mockResolvedValue({
      result: { estado: '6', origem: '5', confirmacaoTermoCienciaResponsabilidade: '1' }
    })
    const atualizaTdv = vi.fn()
    const service = new ConfirmarTermoCienciaService({ detranSpServiceNowTdv: asClient({ buscaTdv, atualizaTdv }) })

    await expect(service.run(authorizationHeader, {
      codigoTransferencia: 'TDV-LOJA'
    })).resolves.toEqual({})

    expect(atualizaTdv).not.toHaveBeenCalled()
  })

  it('is idempotent when the seller has already signed', async () => {
    const buscaTdv = vi.fn().mockResolvedValue({
      result: { estado: '7', origem: '5', confirmacaoTermoCienciaResponsabilidade: '0' }
    })
    const atualizaTdv = vi.fn()
    const service = new ConfirmarTermoCienciaService({ detranSpServiceNowTdv: asClient({ buscaTdv, atualizaTdv }) })

    await expect(service.run(authorizationHeader, {
      codigoTransferencia: 'TDV-LOJA'
    })).resolves.toEqual({})

    expect(atualizaTdv).not.toHaveBeenCalled()
  })

  it('does not PATCH origem 1', async () => {
    const buscaTdv = vi.fn().mockResolvedValue({
      result: { estado: '2', origem: '1', confirmacaoTermoCienciaResponsabilidade: '0' }
    })
    const atualizaTdv = vi.fn()
    const service = new ConfirmarTermoCienciaService({ detranSpServiceNowTdv: asClient({ buscaTdv, atualizaTdv }) })

    await expect(service.run(authorizationHeader, {
      codigoTransferencia: 'TDV-1'
    })).resolves.toEqual({})

    expect(atualizaTdv).not.toHaveBeenCalled()
  })
})
