import createError from 'http-errors'
import { describe, expect, it, vi } from 'vitest'
import { DetranSpServiceNowError } from '../../../clients/detran-sp-service-now'
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
  emailVendedor: '',
  cepComprador: '01310100',
  logradouroComprador: 'Av. Paulista',
  bairroComprador: 'Bela Vista',
  numeroComprador: '1000'
}

const vehicleSummary = {
  id: '1',
  plate: 'GHI8J90',
  title: 'VW/GOL 1.0',
  licensingStatus: 'REGULAR',
  brandModel: 'VW/GOL 1.0',
  licensingExpirationDate: '',
  renavam: '00010020031',
  lastLicensing: '',
  yearFab: '',
  yearMod: ''
}

function asClient (client: Partial<DetranSpServiceNowTdvClient>): DetranSpServiceNowTdvClient {
  return {
    listaTdvs: vi.fn().mockResolvedValue({ result: [] }),
    ...client
  } as DetranSpServiceNowTdvClient
}

describe('CriarCompraService', () => {
  it('creates TDV with stub origem and includes address on criaTdv', async () => {
    const criaTdv = vi.fn().mockResolvedValue({
      result: { codigoTransferenciaVeiculo: 'TDV-NEW' }
    })
    const atualizaTdv = vi.fn()
    const listaTdvs = vi.fn()
    const buscaTdv = vi.fn().mockResolvedValue({
      result: {
        estado: CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA,
        placaVeiculo: 'GHI8J90',
        descricaoMarcaVeiculo: 'VW/GOL 1.0',
        codigoRenavamVeiculo: '00010020031',
        nomeComprador: 'Maria Compradora'
      }
    })

    const service = new CriarCompraService({
      detranSpServiceNowTdv: asClient({ criaTdv, atualizaTdv, listaTdvs, buscaTdv })
    })

    await expect(service.run(authHeader, baseInput)).resolves.toEqual({
      proximaAcao: 'aviso_pagamento',
      estado: CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA,
      codigoTransferencia: 'TDV-NEW',
      vehicle: vehicleSummary,
      nomeComprador: 'Maria Compradora'
    })

    expect(criaTdv).toHaveBeenCalledWith(clientAuth, {
      codigoRenavamVeiculo: '00010020031',
      placaVeiculo: 'GHI8J90',
      nomeVendedor: 'João Vendedor',
      emailVendedor: '',
      codigoVendedor: '11122233344',
      origem: CodigoOrigemTDV.E_NOTARIADO,
      cepComprador: '01310100',
      bairroComprador: 'Bela Vista',
      logradouroComprador: 'Av. Paulista',
      numeroComprador: '1000',
      complementoComprador: '',
      confirmacaoAutodeclaracaoResidenciaComprador: 'true'
    })
    expect(atualizaTdv).not.toHaveBeenCalled()
    expect(listaTdvs).not.toHaveBeenCalled()
    expect(buscaTdv).toHaveBeenCalledWith(
      clientAuth,
      'TDV-NEW',
      'placaVeiculo,descricaoMarcaVeiculo,descricaoCorVeiculo,nomeComprador,estado,codigoRenavamVeiculo'
    )
  })

  it('forwards optional listing fields including ativa and estado to criaTdv', async () => {
    const criaTdv = vi.fn().mockResolvedValue({
      result: { codigoTransferenciaVeiculo: 'TDV-NEW' }
    })
    const buscaTdv = vi.fn().mockResolvedValue({
      result: {
        estado: CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA,
        placaVeiculo: 'GHI8J90',
        descricaoMarcaVeiculo: 'VW/GOL 1.0',
        codigoRenavamVeiculo: '00010020031'
      }
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
    })).resolves.toMatchObject({ proximaAcao: 'aviso_pagamento', codigoTransferencia: 'TDV-NEW' })

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
      nomeMunicipioComprador: 'CAMPINAS',
      cepComprador: '01310100',
      bairroComprador: 'Bela Vista',
      logradouroComprador: 'Av. Paulista',
      numeroComprador: '1000',
      complementoComprador: '',
      confirmacaoAutodeclaracaoResidenciaComprador: 'true'
    })
  })

  it('strips the CPF mask before forwarding codigoComprador to ServiceNow', async () => {
    const criaTdv = vi.fn().mockResolvedValue({
      result: { codigoTransferenciaVeiculo: 'TDV-NEW' }
    })
    const buscaTdv = vi.fn().mockResolvedValue({
      result: {
        estado: CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA,
        placaVeiculo: 'GHI8J90',
        codigoRenavamVeiculo: '00010020031'
      }
    })

    const service = new CriarCompraService({
      detranSpServiceNowTdv: asClient({ criaTdv, buscaTdv })
    })

    await service.run(authHeader, {
      ...baseInput,
      codigoComprador: '123.456.789-01',
      nomeComprador: 'Não informado'
    })

    expect(criaTdv).toHaveBeenCalledWith(clientAuth, expect.objectContaining({
      codigoComprador: '12345678901'
    }))
    expect(criaTdv.mock.calls[0]?.[1]).not.toHaveProperty('nomeComprador')
  })

  it('keeps the leading zeros the listing sends in codigoComprador', async () => {
    const criaTdv = vi.fn().mockResolvedValue({
      result: { codigoTransferenciaVeiculo: 'TDV-NEW' }
    })
    const buscaTdv = vi.fn().mockResolvedValue({
      result: {
        estado: CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA,
        placaVeiculo: 'GHI8J90',
        codigoRenavamVeiculo: '00010020031'
      }
    })

    const service = new CriarCompraService({
      detranSpServiceNowTdv: asClient({ criaTdv, buscaTdv })
    })

    await service.run(authHeader, {
      ...baseInput,
      codigoComprador: '00034324084807'
    })

    expect(criaTdv).toHaveBeenCalledWith(clientAuth, expect.objectContaining({
      codigoComprador: '00034324084807'
    }))
  })

  it('does not list TDVs to fill missing optional fields before create', async () => {
    const listaTdvs = vi.fn()
    const criaTdv = vi.fn().mockResolvedValue({
      result: { codigoTransferenciaVeiculo: 'TDV-NEW' }
    })
    const buscaTdv = vi.fn().mockResolvedValue({
      result: {
        estado: CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA,
        placaVeiculo: 'GHI8J90',
        codigoRenavamVeiculo: '00010020031'
      }
    })

    const service = new CriarCompraService({
      detranSpServiceNowTdv: asClient({ listaTdvs, criaTdv, buscaTdv })
    })

    await expect(service.run(authHeader, baseInput)).resolves.toMatchObject({
      proximaAcao: 'aviso_pagamento',
      codigoTransferencia: 'TDV-NEW'
    })

    expect(listaTdvs).not.toHaveBeenCalled()
    expect(criaTdv).toHaveBeenCalledWith(clientAuth, expect.objectContaining({
      cepComprador: '01310100',
      logradouroComprador: 'Av. Paulista',
      bairroComprador: 'Bela Vista',
      numeroComprador: '1000',
      complementoComprador: '',
      confirmacaoAutodeclaracaoResidenciaComprador: 'true'
    }))
    expect(criaTdv.mock.calls[0]?.[1]).not.toHaveProperty('chassiVeiculo')
    expect(criaTdv.mock.calls[0]?.[1]).not.toHaveProperty('kmVistoriadaVeiculo')
    expect(criaTdv.mock.calls[0]?.[1]).not.toHaveProperty('codigoTransferenciaVeiculo')
  })

  it('falls back kmVeiculo to kmVistoriadaVeiculo when vistoriada is absent', async () => {
    const criaTdv = vi.fn().mockResolvedValue({
      result: { codigoTransferenciaVeiculo: 'TDV-NEW' }
    })
    const buscaTdv = vi.fn().mockResolvedValue({
      result: {
        estado: CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA,
        placaVeiculo: 'GHI8J90',
        codigoRenavamVeiculo: '00010020031'
      }
    })

    const service = new CriarCompraService({
      detranSpServiceNowTdv: asClient({ criaTdv, buscaTdv })
    })

    await expect(service.run(authHeader, {
      ...baseInput,
      kmVeiculo: '32675'
    })).resolves.toMatchObject({
      proximaAcao: 'aviso_pagamento',
      codigoTransferencia: 'TDV-NEW'
    })

    expect(criaTdv).toHaveBeenCalledWith(clientAuth, expect.objectContaining({
      kmVeiculo: '32675',
      kmVistoriadaVeiculo: '32675',
      confirmacaoAutodeclaracaoResidenciaComprador: 'true'
    }))
  })

  it('forwards the client-supplied address to criaTdv without a CEP lookup', async () => {
    const criaTdv = vi.fn().mockResolvedValue({
      result: { codigoTransferenciaVeiculo: 'TDV-NEW' }
    })
    const buscaEndereco = vi.fn()
    const buscaTdv = vi.fn().mockResolvedValue({
      result: {
        estado: CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA,
        placaVeiculo: 'GHI8J90',
        codigoRenavamVeiculo: '00010020031'
      }
    })

    const service = new CriarCompraService({
      detranSpServiceNowTdv: asClient({ criaTdv, buscaEndereco, buscaTdv })
    })

    await expect(service.run(authHeader, {
      ...baseInput,
      cepComprador: '01310-100',
      logradouroComprador: 'Av. Paulista',
      numeroComprador: '1000',
      complementoComprador: 'Sala 10',
      bairroComprador: 'Bela Vista',
      chassiVeiculo: '9BWZZZ377VT004251',
      kmVistoriadaVeiculo: '32009'
    })).resolves.toMatchObject({ proximaAcao: 'aviso_pagamento' })

    expect(buscaEndereco).not.toHaveBeenCalled()
    expect(criaTdv).toHaveBeenCalledWith(clientAuth, expect.objectContaining({
      cepComprador: '01310100',
      logradouroComprador: 'Av. Paulista',
      numeroComprador: '1000',
      complementoComprador: 'Sala 10',
      bairroComprador: 'Bela Vista',
      confirmacaoAutodeclaracaoResidenciaComprador: 'true'
    }))
  })

  it('maps estado 8 to pagamento_confirmado', async () => {
    const criaTdv = vi.fn().mockResolvedValue({
      result: { codigoTransferenciaVeiculo: 'TDV-NEW' }
    })
    const buscaTdv = vi.fn().mockResolvedValue({
      result: {
        estado: CodigoEstadoTDV.TAXA_SERVICO_PAGA,
        placaVeiculo: 'GHI8J90',
        descricaoMarcaVeiculo: 'VW/GOL 1.0',
        codigoRenavamVeiculo: '00010020031'
      }
    })

    const service = new CriarCompraService({
      detranSpServiceNowTdv: asClient({ criaTdv, buscaTdv })
    })

    await expect(service.run(authHeader, baseInput)).resolves.toEqual({
      proximaAcao: 'pagamento_confirmado',
      estado: CodigoEstadoTDV.TAXA_SERVICO_PAGA,
      codigoTransferencia: 'TDV-NEW',
      vehicle: vehicleSummary
    })
  })

  it('resumes existing TDV on TDVAtivaExistenteError', async () => {
    const criaTdv = vi.fn().mockRejectedValue(
      createError(500, new DetranSpServiceNowError('tdvativaexistenteerror', 'Já existe TDV ativa'), { expose: true })
    )
    const listaTdvs = vi.fn().mockResolvedValue({
      result: [{
        placaVeiculo: 'GHI8J90',
        codigoRenavamVeiculo: '00010020031',
        codigoTransferenciaVeiculo: 'TDV-EXISTING',
        chassiVeiculo: '9BWZZZ377VT004251',
        kmVistoriadaVeiculo: '32009',
        numeroComprador: '221'
      }]
    })
    const buscaTdv = vi.fn().mockResolvedValue({
      result: {
        estado: CodigoEstadoTDV.TRANSFERENCIA_CONCLUIDA,
        placaVeiculo: 'GHI8J90',
        descricaoMarcaVeiculo: 'VW/GOL 1.0',
        codigoRenavamVeiculo: '00010020031',
        nomeComprador: 'Maria Compradora'
      }
    })

    const service = new CriarCompraService({
      detranSpServiceNowTdv: asClient({ criaTdv, listaTdvs, buscaTdv })
    })

    await expect(service.run(authHeader, baseInput)).resolves.toEqual({
      proximaAcao: 'concluido',
      estado: CodigoEstadoTDV.TRANSFERENCIA_CONCLUIDA,
      codigoTransferencia: 'TDV-EXISTING',
      vehicle: vehicleSummary,
      nomeComprador: 'Maria Compradora'
    })

    expect(listaTdvs).toHaveBeenCalledWith(clientAuth, {
      ativa: 'true',
      codigoComprador: cpf,
      placaVeiculo: 'GHI8J90'
    })
    expect(buscaTdv).toHaveBeenCalledWith(
      clientAuth,
      'TDV-EXISTING',
      'placaVeiculo,descricaoMarcaVeiculo,descricaoCorVeiculo,nomeComprador,estado,codigoRenavamVeiculo'
    )
  })

  it('rejects when address fields are missing', async () => {
    const criaTdv = vi.fn()
    const buscaEndereco = vi.fn()
    const listaTdvs = vi.fn()

    const service = new CriarCompraService({
      detranSpServiceNowTdv: asClient({ criaTdv, buscaEndereco, listaTdvs })
    })

    const required = {
      placaVeiculo: 'GHI8J90',
      renavamVeiculo: '00010020031',
      origem: CodigoOrigemTDV.E_NOTARIADO,
      nomeVendedor: 'João Vendedor',
      codigoVendedor: '11122233344',
      emailVendedor: ''
    }

    await expect(service.run(authHeader, {
      ...required,
      cepComprador: '  '
    })).rejects.toMatchObject({
      status: 400,
      message: 'cepComprador, bairroComprador e logradouroComprador são obrigatórios'
    })

    await expect(service.run(authHeader, {
      ...required,
      cepComprador: '123'
    })).rejects.toMatchObject({
      status: 400,
      message: 'cepComprador, bairroComprador e logradouroComprador são obrigatórios'
    })

    await expect(service.run(authHeader, {
      ...required,
      cepComprador: '01310-100',
      numeroComprador: '100'
    })).rejects.toMatchObject({
      status: 400,
      message: 'cepComprador, bairroComprador e logradouroComprador são obrigatórios'
    })

    expect(buscaEndereco).not.toHaveBeenCalled()
    expect(listaTdvs).not.toHaveBeenCalled()
    expect(criaTdv).not.toHaveBeenCalled()
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
          result: {
            estado: CodigoEstadoTDV.TRANSFERENCIA_CONCLUIDA,
            placaVeiculo: 'GHI8J90',
            descricaoMarcaVeiculo: 'VW/GOL 1.0',
            codigoRenavamVeiculo: '00010020031'
          }
        })
      })
    })

    await expect(service.run(authHeader, baseInput)).resolves.toEqual({
      proximaAcao: 'concluido',
      estado: CodigoEstadoTDV.TRANSFERENCIA_CONCLUIDA,
      codigoTransferencia: 'TDV-NEW',
      vehicle: vehicleSummary
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

  it('throws when TDVAtivaExistenteError and no active codigo is found', async () => {
    const service = new CriarCompraService({
      detranSpServiceNowTdv: asClient({
        criaTdv: vi.fn().mockRejectedValue(
          new DetranSpServiceNowError('TDVAtivaExistenteError', 'Já existe TDV ativa')
        ),
        listaTdvs: vi.fn().mockResolvedValue({ result: [] })
      })
    })

    await expect(service.run(authHeader, {
      ...baseInput,
      chassiVeiculo: '9BWZZZ377VT004251',
      kmVistoriadaVeiculo: '32009',
      numeroComprador: '221'
    })).rejects.toThrow('Falha ao criar transferência')
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
  ] as const)('maps %s to proximaAcao %s with detail', async (type, proximaAcao, detail) => {
    const listaTdvs = vi.fn().mockResolvedValue({
      result: [{
        placaVeiculo: 'GHI8J90',
        codigoRenavamVeiculo: '00010020031',
        codigoTransferenciaVeiculo: 'TDV-PEND',
        chassiVeiculo: '9BWZZZ377VT004251',
        kmVistoriadaVeiculo: '32009',
        numeroComprador: '221'
      }]
    })
    const criaTdv = vi.fn().mockRejectedValue(
      createError(500, new DetranSpServiceNowError(type, detail), { expose: true })
    )

    const service = new CriarCompraService({
      detranSpServiceNowTdv: asClient({ criaTdv, listaTdvs })
    })

    await expect(service.run(authHeader, baseInput)).resolves.toEqual({
      proximaAcao,
      detail,
      codigoTransferencia: 'TDV-PEND',
      vehicle: {
        ...vehicleSummary,
        title: '',
        brandModel: ''
      }
    })
  })

  it('returns pendencia without codigo when listaTdvs has no match', async () => {
    const service = new CriarCompraService({
      detranSpServiceNowTdv: asClient({
        criaTdv: vi.fn().mockRejectedValue(
          createError(
            500,
            new DetranSpServiceNowError('PagamentoPendenteError', 'Pagamento de taxa não localizado'),
            { expose: true }
          )
        ),
        listaTdvs: vi.fn().mockResolvedValue({ result: [] })
      })
    })

    await expect(service.run(authHeader, {
      ...baseInput,
      chassiVeiculo: '9BWZZZ377VT004251',
      kmVistoriadaVeiculo: '32009',
      numeroComprador: '221'
    })).resolves.toEqual({
      proximaAcao: 'pagamento_pendente',
      detail: 'Pagamento de taxa não localizado',
      vehicle: {
        ...vehicleSummary,
        title: '',
        brandModel: ''
      }
    })
  })

  it('returns pendencia without codigo when listaTdvs fails during resolution', async () => {
    const service = new CriarCompraService({
      detranSpServiceNowTdv: asClient({
        criaTdv: vi.fn().mockRejectedValue(
          createError(
            500,
            new DetranSpServiceNowError('PagamentoPendenteError', 'Pagamento de taxa não localizado'),
            { expose: true }
          )
        ),
        listaTdvs: vi.fn().mockRejectedValue(new Error('listaTdvs unavailable'))
      })
    })

    await expect(service.run(authHeader, {
      ...baseInput,
      chassiVeiculo: '9BWZZZ377VT004251',
      kmVistoriadaVeiculo: '32009',
      numeroComprador: '221'
    })).resolves.toEqual({
      proximaAcao: 'pagamento_pendente',
      detail: 'Pagamento de taxa não localizado',
      vehicle: {
        ...vehicleSummary,
        title: '',
        brandModel: ''
      }
    })
  })

  it('rethrows unknown ServiceNow errors from criaTdv', async () => {
    const error = createError(
      500,
      new DetranSpServiceNowError('SomeUnknownError', 'falha inesperada'),
      { expose: true }
    )
    const service = new CriarCompraService({
      detranSpServiceNowTdv: asClient({
        criaTdv: vi.fn().mockRejectedValue(error),
        listaTdvs: vi.fn().mockResolvedValue({
          result: [{
            placaVeiculo: 'GHI8J90',
            codigoRenavamVeiculo: '00010020031',
            chassiVeiculo: '9BWZZZ377VT004251',
            kmVistoriadaVeiculo: '32009',
            numeroComprador: '221'
          }]
        })
      })
    })

    await expect(service.run(authHeader, baseInput)).rejects.toBe(error)
  })
})
