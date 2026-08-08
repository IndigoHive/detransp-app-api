import createError from 'http-errors'
import { describe, expect, it, vi } from 'vitest'
import { DetranSpServiceNowError } from '../../../clients/detran-sp-service-now'
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
  it('PATCHes full address with estado 7 without CEP lookup', async () => {
    const buscaEndereco = vi.fn()
    const atualizaTdv = vi.fn().mockResolvedValue({ result: { codigoTransferenciaVeiculo: 'TDV-1' } })

    const service = new ConfirmarEnderecoService({
      detranSpServiceNowTdv: asClient({ atualizaTdv, buscaEndereco })
    })

    await expect(service.run(authHeader, {
      codigoTransferencia: 'TDV-1',
      cepComprador: '01310-100',
      logradouroComprador: 'Av. Paulista',
      numeroComprador: '1000',
      complementoComprador: 'Sala 10',
      bairroComprador: 'Bela Vista'
    })).resolves.toEqual({
      enderecoComprador: 'Av. Paulista, 1000, Sala 10, Bela Vista, 01310100',
      cepComprador: '01310100',
      logradouroComprador: 'Av. Paulista',
      numeroComprador: '1000',
      complementoComprador: 'Sala 10',
      bairroComprador: 'Bela Vista',
      estado: CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA
    })

    expect(buscaEndereco).not.toHaveBeenCalled()
    expect(atualizaTdv).toHaveBeenCalledWith(clientAuth, 'TDV-1', {
      cepComprador: '01310100',
      logradouroComprador: 'Av. Paulista',
      numeroComprador: '1000',
      complementoComprador: 'Sala 10',
      bairroComprador: 'Bela Vista',
      estado: CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA
    })
  })

  it('looks up CEP when only CEP is provided and PATCHes with estado 7', async () => {
    const buscaEndereco = vi.fn().mockResolvedValue({
      result: {
        bairro: 'Jardim Paulista',
        logradouro: 'Rua das Flores',
        endereco: 'Rua das Flores',
        complemento: 'Apto 12'
      }
    })
    const atualizaTdv = vi.fn().mockResolvedValue({ result: { codigoTransferenciaVeiculo: 'TDV-1' } })

    const service = new ConfirmarEnderecoService({
      detranSpServiceNowTdv: asClient({ atualizaTdv, buscaEndereco })
    })

    await expect(service.run(authHeader, {
      codigoTransferencia: 'TDV-1',
      cepComprador: '01310-100',
      numeroComprador: '100'
    })).resolves.toMatchObject({
      cepComprador: '01310100',
      logradouroComprador: 'Rua das Flores',
      numeroComprador: '100',
      bairroComprador: 'Jardim Paulista',
      estado: CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA
    })

    expect(buscaEndereco).toHaveBeenCalledWith(clientAuth, '01310100')
    expect(atualizaTdv).toHaveBeenCalledWith(clientAuth, 'TDV-1', {
      cepComprador: '01310100',
      bairroComprador: 'Jardim Paulista',
      logradouroComprador: 'Rua das Flores',
      numeroComprador: '100',
      complementoComprador: 'Apto 12',
      estado: CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA
    })
  })

  it('formats address without PATCH when codigoTransferencia is empty (stub hold)', async () => {
    const atualizaTdv = vi.fn()
    const buscaEndereco = vi.fn()

    const service = new ConfirmarEnderecoService({
      detranSpServiceNowTdv: asClient({ atualizaTdv, buscaEndereco })
    })

    await expect(service.run(authHeader, {
      codigoTransferencia: '',
      cepComprador: '01310-100',
      logradouroComprador: 'Av. Paulista',
      numeroComprador: '1000',
      complementoComprador: 'Sala 10',
      bairroComprador: 'Bela Vista'
    })).resolves.toEqual({
      enderecoComprador: 'Av. Paulista, 1000, Sala 10, Bela Vista, 01310100',
      cepComprador: '01310100',
      logradouroComprador: 'Av. Paulista',
      numeroComprador: '1000',
      complementoComprador: 'Sala 10',
      bairroComprador: 'Bela Vista',
      estado: CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA
    })

    expect(atualizaTdv).not.toHaveBeenCalled()
    expect(buscaEndereco).not.toHaveBeenCalled()
  })

  it('rejects missing CEP when full address is absent', async () => {
    const service = new ConfirmarEnderecoService({
      detranSpServiceNowTdv: asClient({})
    })

    await expect(service.run(authHeader, { codigoTransferencia: 'TDV-1' }))
      .rejects.toMatchObject({ status: 400, message: 'cepComprador é obrigatório' })
  })

  it.each([
    ['PagamentoPendenteError', 'pagamento_pendente', 'Pagamento de taxa não localizado'],
    [
      'PagamentoVistoriaPendentesError',
      'vistoria_pagamento_pendentes',
      'Pagamento de taxa não localizado,Laudo de vistoria não localizado'
    ],
    [
      'SituacaoAdministrativaPendenteError',
      'administrativa_pendente',
      'Veículo com bloqueio - Baixa permanente'
    ],
    ['SituacaoJudicialPendenteError', 'judicial_pendente', 'Veículo com Restrição Judicial'],
    [
      'SituacoesAdministrativaJudicialPendentesError',
      'administrativa_judicial_pendentes',
      'Veículo com bloqueio - Baixa permanente,Veículo com Restrição Judicial'
    ]
  ] as const)('maps PATCH %s to proximaAcao %s', async (type, proximaAcao, detail) => {
    const atualizaTdv = vi.fn().mockRejectedValue(
      createError(500, new DetranSpServiceNowError(type, detail), { expose: true })
    )

    const service = new ConfirmarEnderecoService({
      detranSpServiceNowTdv: asClient({ atualizaTdv })
    })

    await expect(service.run(authHeader, {
      codigoTransferencia: 'TDV-1',
      cepComprador: '01310-100',
      logradouroComprador: 'Av. Paulista',
      numeroComprador: '1000',
      bairroComprador: 'Bela Vista'
    })).resolves.toEqual({
      proximaAcao,
      detail,
      codigoTransferencia: 'TDV-1'
    })
  })

  it('rethrows unknown ServiceNow errors from atualizaTdv', async () => {
    const error = createError(
      500,
      new DetranSpServiceNowError('SomeUnknownError', 'falha inesperada'),
      { expose: true }
    )
    const service = new ConfirmarEnderecoService({
      detranSpServiceNowTdv: asClient({
        atualizaTdv: vi.fn().mockRejectedValue(error)
      })
    })

    await expect(service.run(authHeader, {
      codigoTransferencia: 'TDV-1',
      cepComprador: '01310-100',
      logradouroComprador: 'Av. Paulista',
      numeroComprador: '1000',
      bairroComprador: 'Bela Vista'
    })).rejects.toBe(error)
  })
})
