import { describe, expect, it, vi } from 'vitest'
import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { CodigoEstadoTDV, CodigoOrigemComunicacaoVendaVeiculo, CodigoOrigemTDV } from '../../../clients/detran-sp-service-now/tdv/types'
import { CriarCompraService } from './criar-compra-service'

const cpf = '12345678901'
const authHeader = `Bearer header.${Buffer.from(JSON.stringify({ preferred_username: cpf })).toString('base64url')}.sig`
const clientAuth = { token: authHeader.replace(/^Bearer\s+/i, ''), cpf }

const baseInput = {
  placaVeiculo: 'GHI8J90',
  renavamVeiculo: '00010020031',
  origem: CodigoOrigemTDV.E_NOTARIADO,
  nomeVendedor: 'João Vendedor',
  codigoVendedor: '11122233344',
  emailVendedor: ''
}

function asClient (client: Partial<DetranSpServiceNowTdvClient>): DetranSpServiceNowTdvClient {
  return {
    listaTdvs: vi.fn().mockResolvedValue({ result: [] }),
    ...client
  } as DetranSpServiceNowTdvClient
}

describe('CriarCompraService', () => {
  it('creates TDV with stub origem and routes by estado without address PATCH when CEP is absent', async () => {
    const criaTdv = vi.fn().mockResolvedValue({
      result: { codigoTransferenciaVeiculo: 'TDV-NEW' }
    })
    const buscaEndereco = vi.fn()
    const atualizaTdv = vi.fn()
    const buscaTdv = vi.fn().mockResolvedValue({
      result: { estado: CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA }
    })

    const service = new CriarCompraService({
      detranSpServiceNowTdv: asClient({ criaTdv, buscaEndereco, atualizaTdv, buscaTdv })
    })

    await expect(service.run(authHeader, baseInput)).resolves.toEqual({
      proximaAcao: 'aviso_pagamento',
      estado: CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA
    })

    expect(criaTdv).toHaveBeenCalledWith(clientAuth, {
      codigoRenavamVeiculo: '00010020031',
      placaVeiculo: 'GHI8J90',
      nomeVendedor: 'João Vendedor',
      emailVendedor: '',
      codigoVendedor: '11122233344',
      origem: CodigoOrigemTDV.E_NOTARIADO
    })
    expect(buscaEndereco).not.toHaveBeenCalled()
    expect(atualizaTdv).not.toHaveBeenCalled()
    expect(buscaTdv).toHaveBeenCalledWith(clientAuth, 'TDV-NEW')
  })

  it('forwards optional listing fields to criaTdv and maps ativa 1 to true', async () => {
    const criaTdv = vi.fn().mockResolvedValue({
      result: { codigoTransferenciaVeiculo: 'TDV-NEW' }
    })
    const buscaTdv = vi.fn().mockResolvedValue({
      result: { estado: CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA }
    })

    const service = new CriarCompraService({
      detranSpServiceNowTdv: asClient({ criaTdv, buscaTdv })
    })

    await expect(service.run(authHeader, {
      ...baseInput,
      ativa: '1',
      estado: CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA,
      origemComunicacaoVendaVeiculo: CodigoOrigemComunicacaoVendaVeiculo.E_NOTARIADO,
      codigoTransferenciaVeiculo: '  ',
      descricaoMarcaVeiculo: 'VW/GOL 1.0',
      codigoComprador: '12345678901',
      nomeComprador: 'Maria Compradora',
      nomeMunicipioVeiculo: 'SAO PAULO',
      nomeMunicipioComprador: 'CAMPINAS'
    })).resolves.toMatchObject({ proximaAcao: 'aviso_pagamento' })

    expect(criaTdv).toHaveBeenCalledWith(clientAuth, {
      codigoRenavamVeiculo: '00010020031',
      placaVeiculo: 'GHI8J90',
      nomeVendedor: 'João Vendedor',
      emailVendedor: '',
      codigoVendedor: '11122233344',
      origem: CodigoOrigemTDV.E_NOTARIADO,
      ativa: 'true',
      estado: CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA,
      origemComunicacaoVendaVeiculo: CodigoOrigemComunicacaoVendaVeiculo.E_NOTARIADO,
      descricaoMarcaVeiculo: 'VW/GOL 1.0',
      codigoComprador: '12345678901',
      nomeComprador: 'Maria Compradora',
      nomeMunicipioVeiculo: 'SAO PAULO',
      nomeMunicipioComprador: 'CAMPINAS'
    })
  })

  it('enriches missing chassi, km vistoriada and numero from listaTdvs stub', async () => {
    const listaTdvs = vi.fn().mockResolvedValue({
      result: [{
        placaVeiculo: 'GHI8J90',
        codigoRenavamVeiculo: '00010020031',
        chassiVeiculo: '9BWZZZ377VT004251',
        kmVistoriadaVeiculo: '32009',
        numeroComprador: '221'
      }]
    })
    const criaTdv = vi.fn().mockResolvedValue({
      result: { codigoTransferenciaVeiculo: 'TDV-NEW' }
    })
    const buscaTdv = vi.fn().mockResolvedValue({
      result: { estado: CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA }
    })

    const service = new CriarCompraService({
      detranSpServiceNowTdv: asClient({ listaTdvs, criaTdv, buscaTdv })
    })

    await expect(service.run(authHeader, baseInput)).resolves.toMatchObject({
      proximaAcao: 'aviso_pagamento'
    })

    expect(listaTdvs).toHaveBeenCalledWith(clientAuth, {
      ativa: 'true',
      codigoComprador: cpf
    })
    expect(criaTdv).toHaveBeenCalledWith(clientAuth, expect.objectContaining({
      chassiVeiculo: '9BWZZZ377VT004251',
      kmVistoriadaVeiculo: '32009',
      numeroComprador: '221'
    }))
  })

  it('includes address fields on criaTdv when CEP is provided, without post-create PATCH', async () => {
    const criaTdv = vi.fn().mockResolvedValue({
      result: { codigoTransferenciaVeiculo: 'TDV-NEW' }
    })
    const buscaEndereco = vi.fn().mockResolvedValue({
      result: {
        bairro: 'Jardim Paulista',
        logradouro: 'Rua das Flores',
        endereco: 'Rua das Flores',
        complemento: 'Apto 12'
      }
    })
    const atualizaTdv = vi.fn()
    const buscaTdv = vi.fn().mockResolvedValue({
      result: { estado: CodigoEstadoTDV.TAXA_SERVICO_PAGA }
    })

    const service = new CriarCompraService({
      detranSpServiceNowTdv: asClient({ criaTdv, buscaEndereco, atualizaTdv, buscaTdv })
    })

    await expect(service.run(authHeader, {
      ...baseInput,
      cepComprador: '01310-100',
      numeroComprador: '100',
      chassiVeiculo: '9BWZZZ377VT004251',
      kmVistoriadaVeiculo: '32009'
    })).resolves.toEqual({
      proximaAcao: 'pagamento_confirmado',
      estado: CodigoEstadoTDV.TAXA_SERVICO_PAGA
    })

    expect(buscaEndereco).toHaveBeenCalledWith(clientAuth, '01310100')
    expect(criaTdv).toHaveBeenCalledWith(clientAuth, {
      codigoRenavamVeiculo: '00010020031',
      placaVeiculo: 'GHI8J90',
      nomeVendedor: 'João Vendedor',
      emailVendedor: '',
      codigoVendedor: '11122233344',
      origem: CodigoOrigemTDV.E_NOTARIADO,
      cepComprador: '01310100',
      bairroComprador: 'Jardim Paulista',
      logradouroComprador: 'Rua das Flores',
      numeroComprador: '100',
      complementoComprador: 'Apto 12',
      chassiVeiculo: '9BWZZZ377VT004251',
      kmVistoriadaVeiculo: '32009'
    })
    expect(atualizaTdv).not.toHaveBeenCalled()
  })

  it('skips address lookup when CEP is empty or invalid', async () => {
    const criaTdv = vi.fn().mockResolvedValue({
      result: { codigoTransferenciaVeiculo: 'TDV-NEW' }
    })
    const buscaEndereco = vi.fn()
    const buscaTdv = vi.fn().mockResolvedValue({
      result: { estado: CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA }
    })

    const service = new CriarCompraService({
      detranSpServiceNowTdv: asClient({ criaTdv, buscaEndereco, buscaTdv })
    })

    await expect(service.run(authHeader, { ...baseInput, cepComprador: '  ' }))
      .resolves.toMatchObject({ proximaAcao: 'aviso_pagamento' })

    await expect(service.run(authHeader, { ...baseInput, cepComprador: '123' }))
      .resolves.toMatchObject({ proximaAcao: 'aviso_pagamento' })

    expect(buscaEndereco).not.toHaveBeenCalled()
  })

  it('returns snackbar error for unexpected estado', async () => {
    const service = new CriarCompraService({
      detranSpServiceNowTdv: asClient({
        criaTdv: vi.fn().mockResolvedValue({
          result: { codigoTransferenciaVeiculo: 'TDV-NEW' }
        }),
        buscaTdv: vi.fn().mockResolvedValue({
          result: { estado: CodigoEstadoTDV.AUTODECLARACAO_RESIDENCIA_CONFIRMADA }
        })
      })
    })

    await expect(service.run(authHeader, baseInput)).resolves.toEqual({
      showSnackbar: {
        variant: 'error',
        title: 'Erro',
        description: 'Estado da transferência inválido para continuar'
      }
    })
  })

  it('maps estado 9 to concluido', async () => {
    const service = new CriarCompraService({
      detranSpServiceNowTdv: asClient({
        criaTdv: vi.fn().mockResolvedValue({
          result: { codigoTransferenciaVeiculo: 'TDV-NEW' }
        }),
        buscaTdv: vi.fn().mockResolvedValue({
          result: { estado: CodigoEstadoTDV.TRANSFERENCIA_CONCLUIDA }
        })
      })
    })

    await expect(service.run(authHeader, baseInput)).resolves.toEqual({
      proximaAcao: 'concluido',
      estado: CodigoEstadoTDV.TRANSFERENCIA_CONCLUIDA
    })
  })

  it('throws when create does not return codigoTransferencia', async () => {
    const service = new CriarCompraService({
      detranSpServiceNowTdv: asClient({
        criaTdv: vi.fn().mockResolvedValue({ result: {} })
      })
    })

    await expect(service.run(authHeader, baseInput))
      .rejects.toThrow('Falha ao criar transferência')
  })
})
