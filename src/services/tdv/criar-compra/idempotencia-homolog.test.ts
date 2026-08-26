import type { Logger } from 'pino'
import { describe, expect, it, vi } from 'vitest'
import type { DetranSpServiceNowTdvClient } from '../../../clients/detran-sp-service-now/tdv'
import { ConsultaComprasService } from '../consulta-compras'
import { CriarCompraService } from './criar-compra-service'

const cpf = '34324084807'
const authHeader = `Bearer h.${Buffer.from(JSON.stringify({ preferred_username: cpf })).toString('base64url')}.s`
const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as unknown as Logger

// A comunicação de venda como ela chega, e a TDV que o ServiceNow devolveu depois de criá-la a
// partir dela — os dois recortados da resposta real de homologação (placa BXX0D61).
const CV = {
  codigoTransferenciaVeiculo: null,
  ativa: '1', estado: '7', origem: '2', origemComunicacaoVendaVeiculo: '9',
  placaVeiculo: 'BXX0D61', chassiVeiculo: '9C2BXX1SNSL770361',
  codigoRenavamVeiculo: '01001061869',
  codigoComprador: '00034324084807', nomeComprador: 'JOSILDO ERICSON BERNARDES CABRAL',
  codigoVendedor: '84075575000163', nomeVendedor: 'COMPRADOR PJ TESTE23',
  logradouroComprador: 'RUA BOA VISTA', numeroComprador: '209', bairroComprador: 'CENTRO',
  cepComprador: '01014001', nomeMunicipioComprador: 'SAO PAULO', ufComprador: 'SP'
}

const TDV_CRIADA = {
  ...CV,
  numeroTransferenciaVeiculo: 'TDV0508670',
  codigoTransferenciaVeiculo: 'ec8f63f3fb3e4310b898f4045eefdc1c',
  // O ServiceNow devolve o renavam SEM o zero à esquerda com que a CV foi listada.
  codigoRenavamVeiculo: '1001061869',
  descricaoMarcaVeiculo: 'H/HONDA CB 450 ESPORTE',
  kmVeiculo: '4343', kmVistoriadaVeiculo: '60000', valorVendaVeiculo: '12123'
}

function client (result: unknown[], extra: Partial<DetranSpServiceNowTdvClient> = {}) {
  return {
    listaTdvs: vi.fn().mockResolvedValue({ result }),
    ...extra
  } as unknown as DetranSpServiceNowTdvClient
}

// Reproduz o corpo que o nó Criar Compra monta a partir do veículo selecionado.
function inputDoFlow (v: Awaited<ReturnType<ConsultaComprasService['run']>>['vehicles'][number]) {
  return {
    placaVeiculo: v.plate,
    renavamVeiculo: v.renavam,
    origem: v.origem!,
    nomeVendedor: v.nomeVendedor,
    codigoVendedor: v.codigoVendedor!,
    cepComprador: v.cepComprador!,
    logradouroComprador: v.logradouroComprador!,
    bairroComprador: v.bairroComprador!,
    numeroComprador: v.numeroComprador!,
    ...(v.estado ? { estado: v.estado } : {}),
    ...(v.codigoTransferencia ? { codigoTransferenciaVeiculo: v.codigoTransferencia } : {})
  }
}

describe('idempotência com a massa real de homologação (BXX0D61)', () => {
  it('cria quando ainda é comunicação de venda, e nunca mais recria depois', async () => {
    const criaTdv = vi.fn().mockResolvedValue({
      result: { codigoTransferenciaVeiculo: TDV_CRIADA.codigoTransferenciaVeiculo }
    })
    const buscaTdv = vi.fn().mockResolvedValue({ result: TDV_CRIADA })

    // 1ª passagem: a listagem só tem a CV, sem código.
    const antes = client([CV], { criaTdv, buscaTdv })
    const veiculoAntes = (await new ConsultaComprasService({ detranSpServiceNowTdv: antes })
      .run(authHeader)).vehicles.find(v => v.plate === 'BXX0D61')!

    expect(veiculoAntes.codigoTransferencia).toBe('')

    await expect(
      new CriarCompraService({ detranSpServiceNowTdv: antes, logger })
        .run(authHeader, inputDoFlow(veiculoAntes))
    ).resolves.toMatchObject({ proximaAcao: 'aviso_pagamento', estado: '7' })
    expect(criaTdv).toHaveBeenCalledTimes(1)

    // 2ª passagem: a CV saiu da listagem e no lugar está a TDV, com o renavam sem zero à esquerda.
    const criaTdvDepois = vi.fn()
    const depois = client([TDV_CRIADA], { criaTdv: criaTdvDepois, buscaTdv })
    const veiculoDepois = (await new ConsultaComprasService({ detranSpServiceNowTdv: depois })
      .run(authHeader)).vehicles.find(v => v.plate === 'BXX0D61')!

    expect(veiculoDepois.codigoTransferencia).toBe(TDV_CRIADA.codigoTransferenciaVeiculo)
    expect(veiculoDepois.proximaAcao).toBe('comprador_2')

    // Reentrar na tela de endereço e confirmar de novo não pode recriar nada.
    await expect(
      new CriarCompraService({ detranSpServiceNowTdv: depois, logger })
        .run(authHeader, inputDoFlow(veiculoDepois))
    ).resolves.toMatchObject({
      proximaAcao: 'aviso_pagamento',
      codigoTransferencia: TDV_CRIADA.codigoTransferenciaVeiculo
    })
    expect(criaTdvDepois).not.toHaveBeenCalled()
  })

  it('reconhece a TDV mesmo quando o flow ainda carrega o renavam com zero à esquerda', async () => {
    const criaTdv = vi.fn()
    const buscaTdv = vi.fn().mockResolvedValue({ result: TDV_CRIADA })
    const deps = { detranSpServiceNowTdv: client([TDV_CRIADA], { criaTdv, buscaTdv }), logger }

    // selectedVehicle foi capturado antes da criação: renavam '01001061869'.
    await expect(new CriarCompraService(deps).run(authHeader, {
      placaVeiculo: 'BXX0D61',
      renavamVeiculo: '01001061869',
      origem: '2' as never,
      nomeVendedor: 'COMPRADOR PJ TESTE23',
      codigoVendedor: '84075575000163'
    })).resolves.toMatchObject({ codigoTransferencia: TDV_CRIADA.codigoTransferenciaVeiculo })

    expect(criaTdv).not.toHaveBeenCalled()
  })
})
