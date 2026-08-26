import createError from 'http-errors'
import type { Logger } from 'pino'
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

const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as unknown as Logger

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

    const service = new CriarCompraService({ logger,
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
    // One lookup only: the record echo. Nothing else re-lists.
    expect(listaTdvs).toHaveBeenCalledTimes(1)
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

    const service = new CriarCompraService({ logger,
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

    const service = new CriarCompraService({ logger,
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

  it('picks the right row out of the buyer\'s whole list', async () => {
    // The buyer's listing carries every vehicle they are involved with — TDVs and comunicações
    // de venda alike — so the row has to be found here, not by trusting a server-side filter.
    const listaTdvs = vi.fn().mockResolvedValue({
      result: [
        { placaVeiculo: 'MCK1937', codigoRenavamVeiculo: '01000984815', codigoTransferenciaVeiculo: 'OUTRA-TDV' },
        { placaVeiculo: 'BXX0D45', codigoRenavamVeiculo: '01001061702', codigoTransferenciaVeiculo: null },
        { placaVeiculo: 'GHI8J90', codigoRenavamVeiculo: '00010020031', codigoTransferenciaVeiculo: 'TDV-CERTA' },
        { placaVeiculo: 'CAR0A09', codigoRenavamVeiculo: '01315056345', codigoTransferenciaVeiculo: null }
      ]
    })
    const criaTdv = vi.fn()
    const buscaTdv = vi.fn().mockResolvedValue({
      result: { estado: CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA }
    })

    const service = new CriarCompraService({ logger,
      detranSpServiceNowTdv: asClient({ listaTdvs, criaTdv, buscaTdv })
    })

    await expect(service.run(authHeader, baseInput)).resolves.toMatchObject({
      codigoTransferencia: 'TDV-CERTA'
    })
    expect(criaTdv).not.toHaveBeenCalled()
  })

  it('matches the record even when ServiceNow drops the renavam leading zeros', async () => {
    const listaTdvs = vi.fn().mockResolvedValue({
      result: [{
        placaVeiculo: 'GHI8J90',
        codigoRenavamVeiculo: '10020031',
        codigoTransferenciaVeiculo: 'TDV-SEM-ZERO'
      }]
    })
    const criaTdv = vi.fn()
    const buscaTdv = vi.fn().mockResolvedValue({
      result: { estado: CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA }
    })

    const service = new CriarCompraService({ logger,
      detranSpServiceNowTdv: asClient({ listaTdvs, criaTdv, buscaTdv })
    })

    await expect(service.run(authHeader, baseInput)).resolves.toMatchObject({
      codigoTransferencia: 'TDV-SEM-ZERO'
    })
    expect(criaTdv).not.toHaveBeenCalled()
  })

  it('prefers the row that carries the codigo when the CV and the TDV are both listed', async () => {
    const veiculo = { placaVeiculo: 'GHI8J90', codigoRenavamVeiculo: '00010020031' }
    const listaTdvs = vi.fn().mockResolvedValue({
      result: [veiculo, { ...veiculo, codigoTransferenciaVeiculo: 'TDV-PROMOVIDA' }]
    })
    const criaTdv = vi.fn()
    const buscaTdv = vi.fn().mockResolvedValue({
      result: { estado: CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA }
    })

    const service = new CriarCompraService({ logger,
      detranSpServiceNowTdv: asClient({ listaTdvs, criaTdv, buscaTdv })
    })

    await expect(service.run(authHeader, baseInput)).resolves.toMatchObject({
      codigoTransferencia: 'TDV-PROMOVIDA'
    })
    expect(criaTdv).not.toHaveBeenCalled()
  })

  it('re-lists the buyer when the TDV reached the listing only after the create', async () => {
    const veiculo = { placaVeiculo: 'GHI8J90', codigoRenavamVeiculo: '00010020031' }
    const listaTdvs = vi.fn()
      .mockResolvedValueOnce({ result: [] })
      .mockResolvedValue({ result: [{ ...veiculo, codigoTransferenciaVeiculo: 'TDV-ATRASADA' }] })
    const criaTdv = vi.fn().mockRejectedValue(
      new DetranSpServiceNowError('TDVAtivaExistenteError', 'Já existe TDV ativa')
    )
    const buscaTdv = vi.fn().mockResolvedValue({
      result: { estado: CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA }
    })

    const service = new CriarCompraService({ logger,
      detranSpServiceNowTdv: asClient({ listaTdvs, criaTdv, buscaTdv })
    })

    await expect(service.run(authHeader, baseInput)).resolves.toMatchObject({
      codigoTransferencia: 'TDV-ATRASADA'
    })
  })

  it('falls back to listing by vehicle — TDVAtivaExistenteError is about the vehicle', async () => {
    const veiculo = { placaVeiculo: 'GHI8J90', codigoRenavamVeiculo: '00010020031' }
    const listaTdvs = vi.fn().mockImplementation((_auth, query: Record<string, unknown>) =>
      // The buyer's own listing keeps showing only the comunicação de venda, with no codigo —
      // exactly what homologação returned while ServiceNow refused the create as duplicate.
      query.codigoComprador
        ? Promise.resolve({ result: [veiculo] })
        : Promise.resolve({
            result: [{
              ...veiculo,
              codigoTransferenciaVeiculo: 'TDV-DO-VEICULO',
              codigoComprador: '00012345678901'
            }]
          })
    )
    const criaTdv = vi.fn().mockRejectedValue(
      new DetranSpServiceNowError('TDVAtivaExistenteError', 'Já existe uma TDV ativa para o veículo')
    )
    const buscaTdv = vi.fn().mockResolvedValue({
      result: { estado: CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA }
    })

    const service = new CriarCompraService({ logger,
      detranSpServiceNowTdv: asClient({ listaTdvs, criaTdv, buscaTdv })
    })

    await expect(service.run(authHeader, baseInput)).resolves.toMatchObject({
      codigoTransferencia: 'TDV-DO-VEICULO'
    })
    expect(listaTdvs).toHaveBeenCalledWith(clientAuth, { ativa: 'true', placaVeiculo: 'GHI8J90' })
  })

  it('refuses a vehicle TDV that belongs to another buyer', async () => {
    const veiculo = { placaVeiculo: 'GHI8J90', codigoRenavamVeiculo: '00010020031' }
    const listaTdvs = vi.fn().mockImplementation((_auth, query: Record<string, unknown>) =>
      query.codigoComprador
        ? Promise.resolve({ result: [veiculo] })
        : Promise.resolve({
            result: [{
              ...veiculo,
              codigoTransferenciaVeiculo: 'TDV-DE-OUTRO',
              codigoComprador: '98765432100'
            }]
          })
    )
    const criaTdv = vi.fn().mockRejectedValue(
      new DetranSpServiceNowError('TDVAtivaExistenteError', 'Já existe uma TDV ativa para o veículo')
    )

    const service = new CriarCompraService({ logger,
      detranSpServiceNowTdv: asClient({ listaTdvs, criaTdv })
    })

    await expect(service.run(authHeader, baseInput)).resolves.toMatchObject({
      showSnackbar: expect.objectContaining({ title: 'Transferência já iniciada' })
    })
  })

  it('resumes on TDVAtivaExistenteError when the TDV appeared between the lookup and the create', async () => {
    const cv = { placaVeiculo: 'GHI8J90', codigoRenavamVeiculo: '00010020031' }
    const listaTdvs = vi.fn()
      .mockResolvedValueOnce({ result: [cv] })
      .mockResolvedValue({ result: [{ ...cv, codigoTransferenciaVeiculo: 'TDV-CORRIDA' }] })
    const criaTdv = vi.fn().mockRejectedValue(
      createError(500, new DetranSpServiceNowError('tdvativaexistenteerror', 'Já existe TDV ativa'), { expose: true })
    )
    const buscaTdv = vi.fn().mockResolvedValue({
      result: {
        estado: CodigoEstadoTDV.TAXA_SERVICO_PAGA,
        placaVeiculo: 'GHI8J90',
        codigoRenavamVeiculo: '00010020031'
      }
    })

    const service = new CriarCompraService({ logger,
      detranSpServiceNowTdv: asClient({ criaTdv, listaTdvs, buscaTdv })
    })

    await expect(service.run(authHeader, baseInput)).resolves.toMatchObject({
      proximaAcao: 'pagamento_confirmado',
      codigoTransferencia: 'TDV-CORRIDA'
    })
  })

  it('echoes the listed comunicação de venda back whole, keeping the address it already had', async () => {
    const registro = {
      codigoTransferenciaVeiculo: null,
      numeroTransferenciaVeiculo: 'TDV1470832',
      ativa: '1',
      estado: CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA,
      origem: CodigoOrigemTDV.CARTORIO,
      origemComunicacaoVendaVeiculo: CodigoOrigemComunicacaoVendaVeiculo.CARTORIO,
      placaVeiculo: 'GHI8J90',
      codigoRenavamVeiculo: '00010020031',
      chassiVeiculo: '9BWZZZ377VT004251',
      descricaoMarcaVeiculo: 'VW/GOL 1.0',
      codigoMunicipioVeiculo: '7107',
      nomeMunicipioVeiculo: 'SAO PAULO',
      codigoComprador: '00034324084807',
      nomeComprador: 'Maria Compradora',
      emailComprador: 'maria@example.com',
      codigoMunicipioComprador: '7107',
      nomeMunicipioComprador: 'SAO PAULO',
      ufComprador: 'SP',
      cepComprador: '11010900',
      logradouroComprador: 'PRACA VISCONDE DE MAUA',
      numeroComprador: '209',
      complementoComprador: 'CASA 2',
      bairroComprador: 'CENTRO',
      nomeVendedor: 'João Vendedor',
      codigoVendedor: '00031684755050',
      dataInicialPagamento: '',
      numeroCrvVeiculo: null
    }
    const listaTdvs = vi.fn().mockResolvedValue({ result: [registro] })
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

    const service = new CriarCompraService({ logger,
      detranSpServiceNowTdv: asClient({ listaTdvs, criaTdv, buscaTdv })
    })

    await service.run(authHeader, {
      ...baseInput,
      // What the buyer typed on the address screen only regenerates the declaration text — the
      // record keeps the address the comunicação de venda was registered with.
      cepComprador: '01310100',
      logradouroComprador: 'Av. Paulista',
      bairroComprador: 'Bela Vista',
      numeroComprador: '1000'
    })

    const payload = criaTdv.mock.calls[0]?.[1] as Record<string, unknown>
    expect(payload).toEqual({
      ...Object.fromEntries(Object.entries(registro).filter(([, v]) => v !== null)),
      confirmacaoAutodeclaracaoResidenciaComprador: 'true'
    })
    expect(payload).not.toHaveProperty('numeroCrvVeiculo')
    expect(payload).not.toHaveProperty('codigoTransferenciaVeiculo')
    expect(payload.dataInicialPagamento).toBe('')
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

    const service = new CriarCompraService({ logger,
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

  it('assembles the payload when the record lookup finds nothing, without a second listing', async () => {
    const listaTdvs = vi.fn().mockResolvedValue({ result: [] })
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

    const service = new CriarCompraService({ logger,
      detranSpServiceNowTdv: asClient({ listaTdvs, criaTdv, buscaTdv })
    })

    await expect(service.run(authHeader, baseInput)).resolves.toMatchObject({
      proximaAcao: 'aviso_pagamento',
      codigoTransferencia: 'TDV-NEW'
    })

    expect(listaTdvs).toHaveBeenCalledTimes(1)
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

    const service = new CriarCompraService({ logger,
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

    const service = new CriarCompraService({ logger,
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

    const service = new CriarCompraService({ logger,
      detranSpServiceNowTdv: asClient({ criaTdv, buscaTdv })
    })

    await expect(service.run(authHeader, baseInput)).resolves.toEqual({
      proximaAcao: 'pagamento_confirmado',
      estado: CodigoEstadoTDV.TAXA_SERVICO_PAGA,
      codigoTransferencia: 'TDV-NEW',
      vehicle: vehicleSummary
    })
  })

  it('never recreates a TDV that already has a codigo — reads it and routes by estado', async () => {
    const criaTdv = vi.fn()
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

    const service = new CriarCompraService({ logger,
      detranSpServiceNowTdv: asClient({ criaTdv, listaTdvs, buscaTdv })
    })

    await expect(service.run(authHeader, baseInput)).resolves.toEqual({
      proximaAcao: 'concluido',
      estado: CodigoEstadoTDV.TRANSFERENCIA_CONCLUIDA,
      codigoTransferencia: 'TDV-EXISTING',
      vehicle: vehicleSummary,
      nomeComprador: 'Maria Compradora'
    })

    // No plate filter and no `campos`: the same query /api/tdv/compras uses, so the row is
    // guaranteed to come back — and whole, since the create echoes it.
    expect(listaTdvs).toHaveBeenCalledWith(clientAuth, {
      ativa: 'true',
      codigoComprador: cpf
    })
    expect(buscaTdv).toHaveBeenCalledWith(
      clientAuth,
      'TDV-EXISTING',
      'placaVeiculo,descricaoMarcaVeiculo,descricaoCorVeiculo,nomeComprador,estado,codigoRenavamVeiculo'
    )
    expect(criaTdv).not.toHaveBeenCalled()
  })

  it('forwards a known seller e-mail and never falls back to the buyer token e-mail', async () => {
    const criaTdv = vi.fn().mockResolvedValue({ result: { codigoTransferenciaVeiculo: 'TDV-1' } })
    const buscaTdv = vi.fn().mockResolvedValue({ result: { estado: '7' } })
    const service = new CriarCompraService({ logger, detranSpServiceNowTdv: asClient({ criaTdv, buscaTdv }) })

    await service.run(authHeader, { ...baseInput, emailVendedor: 'vendedor@example.com' })

    expect(criaTdv.mock.calls[0]?.[1]).toMatchObject({ emailVendedor: 'vendedor@example.com' })
  })

  it('rejects when address fields are missing', async () => {
    const criaTdv = vi.fn()
    const buscaEndereco = vi.fn()
    const listaTdvs = vi.fn().mockResolvedValue({ result: [] })

    const service = new CriarCompraService({ logger,
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
    expect(criaTdv).not.toHaveBeenCalled()
  })

  it('returns snackbar error for unexpected estado', async () => {
    const service = new CriarCompraService({ logger,
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
    const service = new CriarCompraService({ logger,
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

  it('reports the TDV as already started when create returns no codigoTransferencia', async () => {
    const service = new CriarCompraService({ logger,
      detranSpServiceNowTdv: asClient({
        criaTdv: vi.fn().mockResolvedValue({ result: {} })
      })
    })

    await expect(service.run(authHeader, baseInput)).resolves.toEqual({
      showSnackbar: {
        variant: 'error',
        title: 'Transferência já iniciada',
        description: 'A transferência deste veículo já foi criada, mas não conseguimos carregá-la agora. Volte para a lista de veículos e selecione-o novamente.'
      }
    })
  })

  it('reports the TDV as already started when TDVAtivaExistenteError leaves no codigo', async () => {
    const service = new CriarCompraService({ logger,
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
    })).resolves.toMatchObject({
      showSnackbar: expect.objectContaining({ title: 'Transferência já iniciada' })
    })
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
    const cv = {
      placaVeiculo: 'GHI8J90',
      codigoRenavamVeiculo: '00010020031',
      chassiVeiculo: '9BWZZZ377VT004251',
      kmVistoriadaVeiculo: '32009',
      numeroComprador: '221'
    }
    // First lookup finds the bare comunicação de venda; after the create raised the pendência the
    // TDV is there, which is how the payment screen gets a codigo to fetch débitos with.
    const listaTdvs = vi.fn()
      .mockResolvedValueOnce({ result: [cv] })
      .mockResolvedValue({ result: [{ ...cv, codigoTransferenciaVeiculo: 'TDV-PEND' }] })
    const criaTdv = vi.fn().mockRejectedValue(
      createError(500, new DetranSpServiceNowError(type, detail), { expose: true })
    )

    const service = new CriarCompraService({ logger,
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
    const service = new CriarCompraService({ logger,
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
    const service = new CriarCompraService({ logger,
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
    const service = new CriarCompraService({ logger,
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
