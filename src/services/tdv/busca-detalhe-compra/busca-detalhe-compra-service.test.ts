import { describe, expect, it, vi } from 'vitest'
import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { BuscaDetalheCompraService } from './busca-detalhe-compra-service'

const cpf = '12345678901'
const authHeader = `Bearer header.${Buffer.from(JSON.stringify({ preferred_username: cpf })).toString('base64url')}.sig`
const clientAuth = { token: authHeader.replace(/^Bearer\s+/i, ''), cpf }

describe('BuscaDetalheCompraService', () => {
  it('fetches address and autodeclaracao campos from buscaTdv', async () => {
    const buscaTdv = vi.fn().mockResolvedValue({
      result: {
        cepComprador: '01310100',
        logradouroComprador: 'Rua das Flores',
        numeroComprador: '123',
        complementoComprador: 'Apto 1',
        bairroComprador: 'Jardim Paulista',
        autodeclaracaoResidenciaComprador: 'Texto SN de autodeclaração',
        nomeComprador: 'Maria Compradora'
      }
    })

    const service = new BuscaDetalheCompraService({
      detranSpServiceNowTdv: { buscaTdv } as unknown as DetranSpServiceNowTdvClient
    })

    await expect(service.run(authHeader, { codigoTransferencia: 'TDV-1' })).resolves.toEqual({
      enderecoComprador: 'Rua das Flores, 123, Apto 1, Jardim Paulista, 01310100',
      cepComprador: '01310100',
      logradouroComprador: 'Rua das Flores',
      numeroComprador: '123',
      complementoComprador: 'Apto 1',
      bairroComprador: 'Jardim Paulista',
      autodeclaracaoResidenciaComprador: 'Texto SN de autodeclaração',
      nomeComprador: 'Maria Compradora'
    })

    expect(buscaTdv).toHaveBeenCalledWith(
      clientAuth,
      'TDV-1',
      'cepComprador,bairroComprador,logradouroComprador,numeroComprador,complementoComprador,autodeclaracaoResidenciaComprador,nomeComprador'
    )
  })

  it('rejects missing codigoTransferencia', async () => {
    const service = new BuscaDetalheCompraService({
      detranSpServiceNowTdv: {} as DetranSpServiceNowTdvClient
    })

    await expect(service.run(authHeader, { codigoTransferencia: '  ' }))
      .rejects.toMatchObject({ status: 400, message: 'codigoTransferencia é obrigatório' })
  })
})
