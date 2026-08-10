import { describe, expect, it, vi } from 'vitest'
import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { BuscaEnderecoService } from './busca-endereco-service'

const cpf = '12345678901'
const authHeader = `Bearer header.${Buffer.from(JSON.stringify({ preferred_username: cpf })).toString('base64url')}.sig`
const clientAuth = { token: authHeader.replace(/^Bearer\s+/i, ''), cpf }

const enderecoPayload = {
  result: {
    cep: '01310100',
    bairro: 'Bela Vista',
    tipoLogradouro: 'Avenida',
    endereco: 'Paulista',
    complemento: null,
    localidade: 'São Paulo',
    estado: 'São Paulo',
    uf: 'SP',
    numeroIBGE: 3550308,
    logradouro: null,
    municipio: 'São Paulo',
    codigoMunicipio: 9668
  }
}

describe('BuscaEnderecoService', () => {
  it('returns the SN payload for a valid CEP', async () => {
    const buscaEndereco = vi.fn().mockResolvedValue(enderecoPayload)
    const service = new BuscaEnderecoService({
      detranSpServiceNowTdv: { buscaEndereco } as unknown as DetranSpServiceNowTdvClient
    })

    await expect(service.run(authHeader, { cep: '01310-100' })).resolves.toEqual(enderecoPayload)
    expect(buscaEndereco).toHaveBeenCalledWith(clientAuth, '01310100')
  })

  it('rejects missing CEP', async () => {
    const service = new BuscaEnderecoService({
      detranSpServiceNowTdv: {} as DetranSpServiceNowTdvClient
    })

    await expect(service.run(authHeader, { cep: '  ' }))
      .rejects.toMatchObject({ status: 400, message: 'cep é obrigatório' })
  })

  it('returns 404 when CEP is not found', async () => {
    const buscaEndereco = vi.fn().mockResolvedValue(undefined)
    const service = new BuscaEnderecoService({
      detranSpServiceNowTdv: { buscaEndereco } as unknown as DetranSpServiceNowTdvClient
    })

    await expect(service.run(authHeader, { cep: '00000000' }))
      .rejects.toMatchObject({ status: 404, message: 'CEP não encontrado' })
  })
})
