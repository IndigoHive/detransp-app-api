import { describe, expect, it, vi } from 'vitest'
import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { CodigoEstadoTDV } from '../../../clients/detran-sp-service-now/tdv/types'
import { ConfirmarEnderecoService } from './confirmar-endereco-service'

const cpf = '12345678901'
const authHeader = `Bearer header.${Buffer.from(JSON.stringify({ preferred_username: cpf })).toString('base64url')}.sig`
const clientAuth = { token: authHeader.replace(/^Bearer\s+/i, ''), cpf }

function asClient (client: Partial<DetranSpServiceNowTdvClient>): DetranSpServiceNowTdvClient {
  return client as DetranSpServiceNowTdvClient
}

describe('ConfirmarEnderecoService', () => {
  it('maps estado 7/8/9 to proximaAcao without address PATCH when CEP is absent', async () => {
    const atualizaTdv = vi.fn()
    const buscaEndereco = vi.fn()
    const buscaTdv = vi.fn().mockResolvedValue({
      result: { estado: CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA }
    })

    const service = new ConfirmarEnderecoService({
      detranSpServiceNowTdv: asClient({ atualizaTdv, buscaEndereco, buscaTdv })
    })

    await expect(service.run(authHeader, { codigoTransferencia: 'TDV-1' }))
      .resolves.toEqual({ proximaAcao: 'aviso_pagamento', estado: CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA })

    expect(buscaEndereco).not.toHaveBeenCalled()
    expect(atualizaTdv).not.toHaveBeenCalled()
    expect(buscaTdv).toHaveBeenCalledWith(clientAuth, 'TDV-1')
  })

  it('updates address without changing estado when CEP is provided, then routes by estado', async () => {
    const buscaEndereco = vi.fn().mockResolvedValue({
      result: {
        bairro: 'Jardim Paulista',
        logradouro: 'Rua das Flores',
        endereco: 'Rua das Flores',
        complemento: 'Apto 12'
      }
    })
    const atualizaTdv = vi.fn().mockResolvedValue({ result: { codigoTransferenciaVeiculo: 'TDV-1' } })
    const buscaTdv = vi.fn().mockResolvedValue({
      result: { estado: CodigoEstadoTDV.TAXA_SERVICO_PAGA }
    })

    const service = new ConfirmarEnderecoService({
      detranSpServiceNowTdv: asClient({ atualizaTdv, buscaEndereco, buscaTdv })
    })

    await expect(service.run(authHeader, {
      codigoTransferencia: 'TDV-1',
      cepComprador: '01310-100'
    })).resolves.toEqual({
      proximaAcao: 'pagamento_confirmado',
      estado: CodigoEstadoTDV.TAXA_SERVICO_PAGA
    })

    expect(buscaEndereco).toHaveBeenCalledWith(clientAuth, '01310100')
    expect(atualizaTdv).toHaveBeenCalledWith(clientAuth, 'TDV-1', {
      cepComprador: '01310100',
      bairroComprador: 'Jardim Paulista',
      logradouroComprador: 'Rua das Flores',
      numeroComprador: '',
      complementoComprador: 'Apto 12'
    })
  })

  it('skips address PATCH when CEP is empty or invalid', async () => {
    const atualizaTdv = vi.fn()
    const buscaEndereco = vi.fn()
    const buscaTdv = vi.fn().mockResolvedValue({
      result: { estado: CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA }
    })

    const service = new ConfirmarEnderecoService({
      detranSpServiceNowTdv: asClient({ atualizaTdv, buscaEndereco, buscaTdv })
    })

    await expect(service.run(authHeader, {
      codigoTransferencia: 'TDV-1',
      cepComprador: '  '
    })).resolves.toMatchObject({ proximaAcao: 'aviso_pagamento' })

    await expect(service.run(authHeader, {
      codigoTransferencia: 'TDV-1',
      cepComprador: '123'
    })).resolves.toMatchObject({ proximaAcao: 'aviso_pagamento' })

    expect(buscaEndereco).not.toHaveBeenCalled()
    expect(atualizaTdv).not.toHaveBeenCalled()
  })

  it('returns snackbar error for unexpected estado', async () => {
    const service = new ConfirmarEnderecoService({
      detranSpServiceNowTdv: asClient({
        buscaTdv: vi.fn().mockResolvedValue({
          result: { estado: CodigoEstadoTDV.AUTODECLARACAO_RESIDENCIA_CONFIRMADA }
        })
      })
    })

    await expect(service.run(authHeader, { codigoTransferencia: 'TDV-1' })).resolves.toEqual({
      showSnackbar: {
        variant: 'error',
        title: 'Erro',
        description: 'Estado da transferência inválido para continuar'
      }
    })
  })

  it('maps estado 9 to concluido', async () => {
    const service = new ConfirmarEnderecoService({
      detranSpServiceNowTdv: asClient({
        buscaTdv: vi.fn().mockResolvedValue({
          result: { estado: CodigoEstadoTDV.TRANSFERENCIA_CONCLUIDA }
        })
      })
    })

    await expect(service.run(authHeader, { codigoTransferencia: 'TDV-1' })).resolves.toEqual({
      proximaAcao: 'concluido',
      estado: CodigoEstadoTDV.TRANSFERENCIA_CONCLUIDA
    })
  })
})
