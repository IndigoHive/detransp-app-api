import { describe, expect, it, vi } from 'vitest'
import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { CodigoEstadoTDV, CodigoOrigemTDV } from '../../../clients/detran-sp-service-now/tdv/types'
import { formatCurrency } from '../../../utils/currency'
import { ConfirmarCompraService } from './confirmar-compra-service'

const cpf = '12345678901'
const authHeader = `Bearer header.${Buffer.from(JSON.stringify({ preferred_username: cpf })).toString('base64url')}.sig`
const clientAuth = { token: authHeader.replace(/^Bearer\s+/i, ''), cpf }

function asClient (client: Partial<DetranSpServiceNowTdvClient>): DetranSpServiceNowTdvClient {
  return client as DetranSpServiceNowTdvClient
}

const tdvData = {
  nomeComprador: 'Carlos da Silva',
  codigoComprador: '72116955017',
  logradouroComprador: 'Rua Aulide Carini',
  numeroComprador: '345',
  bairroComprador: 'Vila Jacuí',
  nomeMunicipioComprador: 'São Paulo',
  ufComprador: 'SP',
  placaVeiculo: 'ABC1D23',
  descricaoMarcaVeiculo: 'Toyota Corolla 2.0',
  codigoRenavamVeiculo: '00001002003',
  valorVendaVeiculo: '90000',
  kmVeiculo: '13000',
  origem: CodigoOrigemTDV.TDV,
  estado: CodigoEstadoTDV.ATPVE_CRIADA
}

describe('ConfirmarCompraService', () => {
  it('advances estado 3 to 4 then 5 and returns confirmação dados with origem and estado', async () => {
    const atualizaTdv = vi.fn().mockResolvedValue({ result: { codigoTransferenciaVeiculo: 'TDV-1' } })
    const buscaTdv = vi.fn()
      .mockResolvedValueOnce({ result: tdvData })
      .mockResolvedValueOnce({
        result: {
          ...tdvData,
          estado: CodigoEstadoTDV.AUTODECLARACAO_RESIDENCIA_CONFIRMADA
        }
      })

    const service = new ConfirmarCompraService({
      detranSpServiceNowTdv: asClient({ atualizaTdv, buscaTdv })
    })

    await expect(service.run(authHeader, {
      codigoTransferencia: 'TDV-1',
      codigoProvaVidaComprador: 'pv-1'
    })).resolves.toEqual({
      nomeComprador: 'Carlos da Silva',
      cpfComprador: '72116955017',
      enderecoComprador: 'Rua Aulide Carini, 345, Vila Jacuí, São Paulo - SP',
      origem: CodigoOrigemTDV.TDV,
      estado: CodigoEstadoTDV.AUTODECLARACAO_RESIDENCIA_CONFIRMADA,
      vehicle: {
        id: '1',
        plate: 'ABC1D23',
        title: 'Toyota Corolla 2.0',
        licensingStatus: 'REGULAR',
        brandModel: 'Toyota Corolla 2.0',
        licensingExpirationDate: '',
        renavam: '00001002003',
        lastLicensing: '',
        yearFab: '',
        yearMod: '',
        valorVenda: formatCurrency(90000),
        quilometragem: '13.000'
      }
    })

    expect(buscaTdv).toHaveBeenCalledWith(clientAuth, 'TDV-1')
    expect(atualizaTdv).toHaveBeenCalledTimes(2)
    expect(atualizaTdv).toHaveBeenNthCalledWith(1, clientAuth, 'TDV-1', {
      estado: CodigoEstadoTDV.INTENCAO_COMPRA_CONFIRMADA,
      codigoProvaVidaComprador: 'pv-1',
      tipoProvaVidaComprador: '2'
    })
    expect(atualizaTdv).toHaveBeenNthCalledWith(2, clientAuth, 'TDV-1', {
      estado: CodigoEstadoTDV.AUTODECLARACAO_RESIDENCIA_CONFIRMADA,
      codigoProvaVidaComprador: 'pv-1',
      tipoProvaVidaComprador: '2',
      confirmacaoAutodeclaracaoResidenciaComprador: 'true'
    })
  })

  it('requires codigoProvaVidaComprador when advancing 4→5', async () => {
    const atualizaTdv = vi.fn()
    const buscaTdv = vi.fn().mockResolvedValue({ result: tdvData })

    const service = new ConfirmarCompraService({
      detranSpServiceNowTdv: asClient({ atualizaTdv, buscaTdv })
    })

    await expect(service.run(authHeader, {
      codigoTransferencia: 'TDV-1'
    })).rejects.toMatchObject({
      status: 400,
      message: 'codigoProvaVidaComprador é obrigatório para avançar a compra'
    })

    expect(atualizaTdv).not.toHaveBeenCalled()
  })

  it('rejects empty codigoTransferencia before calling ServiceNow', async () => {
    const atualizaTdv = vi.fn()
    const buscaTdv = vi.fn()

    const service = new ConfirmarCompraService({
      detranSpServiceNowTdv: asClient({ atualizaTdv, buscaTdv })
    })

    await expect(service.run(authHeader, {
      codigoTransferencia: ''
    })).rejects.toMatchObject({
      status: 400,
      message: 'codigoTransferencia é obrigatório'
    })

    expect(buscaTdv).not.toHaveBeenCalled()
    expect(atualizaTdv).not.toHaveBeenCalled()
  })

  it('skips PATCH when TDV is already at estado 7+ without codigoProvaVidaComprador', async () => {
    const atualizaTdv = vi.fn()
    const buscaTdv = vi.fn().mockResolvedValue({
      result: {
        ...tdvData,
        origem: CodigoOrigemTDV.E_NOTARIADO,
        estado: CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA
      }
    })

    const service = new ConfirmarCompraService({
      detranSpServiceNowTdv: asClient({ atualizaTdv, buscaTdv })
    })

    await expect(service.run(authHeader, {
      codigoTransferencia: 'TDV-2'
    })).resolves.toMatchObject({
      nomeComprador: 'Carlos da Silva',
      origem: CodigoOrigemTDV.E_NOTARIADO,
      estado: CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA
    })

    expect(buscaTdv).toHaveBeenCalledTimes(1)
    expect(atualizaTdv).not.toHaveBeenCalled()
  })
})
