import { describe, expect, it, vi } from 'vitest'
import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { CompradorCepService } from './comprador-cep-service'

const authorizationHeader = 'Bearer eyJhbGciOiJub25lIn0.eyJwcmVmZXJyZWRfdXNlcm5hbWUiOiIwNTI0NjQ4NzYwMSIsIm5hbWUiOiJKb8OjbyBEZXRyYW4iLCJlbWFpbCI6ImpvYW9AZXhhbXBsZS5jb20ifQ.'
const sellerCpf = '05246487601'

const endereco = {
  cep: '08060283',
  bairro: 'Vila Jacuí',
  tipoLogradouro: 'Rua',
  endereco: 'Aulide Carini',
  complemento: null,
  localidade: 'São Paulo',
  estado: 'São Paulo',
  uf: 'SP',
  numeroIBGE: 3550308,
  logradouro: null,
  municipio: 'São Paulo',
  codigoMunicipio: 9668
}

function asClient (client: Partial<DetranSpServiceNowTdvClient>): DetranSpServiceNowTdvClient {
  return client as DetranSpServiceNowTdvClient
}

describe('CompradorCepService', () => {
  it('rejects an incomplete CEP without calling the client', async () => {
    const buscaEndereco = vi.fn()
    const service = new CompradorCepService({ detranSpServiceNowTdv: asClient({ buscaEndereco }) })

    await expect(service.run(authorizationHeader, { cep: '0806' })).resolves.toEqual({
      cidade: null,
      bairro: null,
      logradouro: null,
      errorText: 'CEP inválido'
    })
    expect(buscaEndereco).not.toHaveBeenCalled()
  })

  it('returns an error when the CEP is not found', async () => {
    const buscaEndereco = vi.fn().mockResolvedValue(undefined)
    const service = new CompradorCepService({ detranSpServiceNowTdv: asClient({ buscaEndereco }) })

    await expect(service.run(authorizationHeader, { cep: '08060283' })).resolves.toEqual({
      cidade: null,
      bairro: null,
      logradouro: null,
      errorText: 'CEP não encontrado'
    })
  })

  it('falls back to the endereco field when logradouro is empty', async () => {
    const buscaEndereco = vi.fn().mockResolvedValue({ result: endereco })
    const service = new CompradorCepService({ detranSpServiceNowTdv: asClient({ buscaEndereco }) })

    await expect(service.run(authorizationHeader, { cep: '08060-283' })).resolves.toEqual({
      cidade: 'São Paulo',
      bairro: 'Vila Jacuí',
      logradouro: 'Aulide Carini',
      errorText: null
    })
    expect(buscaEndereco).toHaveBeenCalledWith({ token: expect.any(String), cpf: sellerCpf }, '08060283')
  })

  it('prefers the logradouro returned by the client', async () => {
    const buscaEndereco = vi.fn().mockResolvedValue({ result: { ...endereco, logradouro: 'Rua Aulide Carini' } })
    const service = new CompradorCepService({ detranSpServiceNowTdv: asClient({ buscaEndereco }) })

    await expect(service.run(authorizationHeader, { cep: '08060283' })).resolves.toMatchObject({
      logradouro: 'Rua Aulide Carini'
    })
  })
})
