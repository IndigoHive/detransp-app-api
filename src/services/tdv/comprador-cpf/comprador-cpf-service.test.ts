import { describe, expect, it, vi } from 'vitest'
import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { CompradorCpfService, censorName } from './comprador-cpf-service'

const authorizationHeader = 'Bearer eyJhbGciOiJub25lIn0.eyJwcmVmZXJyZWRfdXNlcm5hbWUiOiIwNTI0NjQ4NzYwMSIsIm5hbWUiOiJKb8OjbyBEZXRyYW4iLCJlbWFpbCI6ImpvYW9AZXhhbXBsZS5jb20ifQ.'
const sellerCpf = '05246487601'

function asClient (client: Partial<DetranSpServiceNowTdvClient>): DetranSpServiceNowTdvClient {
  return client as DetranSpServiceNowTdvClient
}

describe('censorName', () => {
  it('keeps the first and last character, masks the rest, preserves spaces', () => {
    expect(censorName('CARLOS SILVA')).toBe('C***** ****A')
  })
})

describe('CompradorCpfService', () => {
  it('rejects when the buyer CPF matches the seller (current owner)', async () => {
    const buscaCidadao = vi.fn()
    const service = new CompradorCpfService({ detranSpServiceNowTdv: asClient({ buscaCidadao }) })

    await expect(service.run(authorizationHeader, { cpf: sellerCpf })).resolves.toEqual({
      name: null,
      errorText: 'CPF deve ser diferente do proprietário atual'
    })
    expect(buscaCidadao).not.toHaveBeenCalled()
  })

  it('returns an error when the CPF is not found', async () => {
    const buscaCidadao = vi.fn().mockResolvedValue(undefined)
    const service = new CompradorCpfService({ detranSpServiceNowTdv: asClient({ buscaCidadao }) })

    await expect(service.run(authorizationHeader, { cpf: '11122233344' })).resolves.toEqual({
      name: null,
      errorText: 'CPF não encontrado'
    })
  })

  it('returns the censored name on success', async () => {
    const buscaCidadao = vi.fn().mockResolvedValue({ result: { nome: 'CARLOS SILVA' } })
    const service = new CompradorCpfService({ detranSpServiceNowTdv: asClient({ buscaCidadao }) })

    await expect(service.run(authorizationHeader, { cpf: '11122233344' })).resolves.toEqual({
      name: 'C***** ****A',
      errorText: null
    })
    expect(buscaCidadao).toHaveBeenCalledWith({ token: expect.any(String), cpf: sellerCpf }, '11122233344')
  })
})
