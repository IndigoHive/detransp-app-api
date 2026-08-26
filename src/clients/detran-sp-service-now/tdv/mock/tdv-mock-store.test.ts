import pino from 'pino'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Config, TdvMockVersao } from '../../../../types'
import { AnaliseRequisitosService } from '../../../../services/tdv/analise-requisitos'
import { ConsultaComprasService } from '../../../../services/tdv/consulta-compras'
import { ConsultaVeiculosService } from '../../../../services/tdv/consulta-veiculos'
import { CriarCompraService } from '../../../../services/tdv/criar-compra'
import { CriarTdvService } from '../../../../services/tdv/criar-tdv'
import { ValidarTdvService } from '../../../../services/tdv/validar-tdv'
import { AutodeclaracaoResidenciaService } from '../../../../services/tdv/autodeclaracao-residencia'
import { MockDetranSpServiceNowTdvClient } from './mock-detran-sp-service-now-tdv-client'
import { tdvMockStore } from './tdv-mock-store'

const logger = pino({ level: 'silent' })
const SELLER = '22231049830'
const BUYER = '05246487601'

// Unsigned JWT carrying only the claims extract*FromToken reads.
function tokenFor (cpf: string): string {
  const payload = Buffer.from(JSON.stringify({
    preferred_username: cpf,
    email: `${cpf}@example.com`,
    name: 'FULANO DE TAL'
  })).toString('base64url')
  return `Bearer eyJhbGciOiJub25lIn0.${payload}.`
}

function makeConfig (versao: TdvMockVersao, extra: Partial<Config['tdvMock']> = {}): Config {
  return {
    serviceNow: { api: { baseUrl: '' } },
    tdvMock: {
      enabled: true,
      versao,
      sellerCpf: SELLER,
      buyerCpf: BUYER,
      vehiclePlate: '',
      vehicleRenavam: '',
      initialEstado: '',
      forceVehicleRestriction: false,
      forceCidadesDiferentes: false,
      pendencia: '',
      validarTdv: '',
      ...extra
    }
  } as unknown as Config
}

function bootstrap (versao: TdvMockVersao, extra: Partial<Config['tdvMock']> = {}) {
  tdvMockStore.reset()
  const config = makeConfig(versao, extra)
  const client = new MockDetranSpServiceNowTdvClient({ config, logger })
  const seeded = tdvMockStore.ensureSeeded(config.tdvMock)
  const deps = { detranSpServiceNowTdv: client }

  return {
    config,
    seeded,
    compras: () => new ConsultaComprasService(deps).run(tokenFor(BUYER)),
    veiculos: () => new ConsultaVeiculosService(deps).run(tokenFor(SELLER)),
    analise: (plate: string, renavam: string) =>
      new AnaliseRequisitosService({ ...deps, config }).run(tokenFor(SELLER), {
        selectedVehicle: { plate, renavam }
      }),
    criarTdv: (plate: string, renavam: string) =>
      new CriarTdvService(deps).run(tokenFor(SELLER), { placaVeiculo: plate, renavamVeiculo: renavam }),
    criarCompra: (input: Parameters<CriarCompraService['run']>[1]) =>
      new CriarCompraService({ ...deps, logger }).run(tokenFor(BUYER), input),
    validarTdv: (input: Parameters<ValidarTdvService['run']>[1]) =>
      new ValidarTdvService(deps).run(tokenFor(BUYER), input),
    autodeclaracao: (input: Parameters<AutodeclaracaoResidenciaService['run']>[1]) =>
      new AutodeclaracaoResidenciaService(deps).run(tokenFor(BUYER), input)
  }
}

// Fills criar-compra from a listed purchase, the way the flow's Criar Compra node does.
function compraInputFrom (v: Awaited<ReturnType<ConsultaComprasService['run']>>['vehicles'][number]) {
  return {
    placaVeiculo: v.plate,
    renavamVeiculo: v.renavam,
    origem: v.origem!,
    nomeVendedor: v.nomeVendedor,
    codigoVendedor: v.codigoVendedor!,
    ...(v.emailVendedor ? { emailVendedor: v.emailVendedor } : {}),
    cepComprador: '02873610',
    logradouroComprador: 'Rua Juvenal Lira',
    bairroComprador: 'Jardim Elisa Maria',
    numeroComprador: '38',
    ...(v.estado ? { estado: v.estado } : {}),
    ...(v.codigoTransferencia ? { codigoTransferenciaVeiculo: v.codigoTransferencia } : {})
  }
}

beforeEach(() => tdvMockStore.reset())

describe('TdvMockStore — TDV 1.0 (origem 1)', () => {
  it('starts with no mass and lets the seller create the TDV from scratch', async () => {
    const app = bootstrap('1.0')

    expect(app.seeded).toBeNull()
    await expect(app.compras()).resolves.toEqual({ vehicles: [] })

    const { vehicles } = await app.veiculos()
    expect(vehicles).toHaveLength(1)

    const veiculo = vehicles[0]!
    await expect(app.analise(veiculo.plate, veiculo.renavam)).resolves.toMatchObject({
      hasActiveTDV: false,
      proximaAcao: 'nova_tdv'
    })

    const created = await app.criarTdv(veiculo.plate, veiculo.renavam)
    expect(created.codigo).toMatch(/^[0-9a-f]{32}$/)

    await expect(app.analise(veiculo.plate, veiculo.renavam)).resolves.toMatchObject({
      hasActiveTDV: true,
      estado: '1'
    })
  })

  it('honours TDV_MOCK_INITIAL_ESTADO to jump straight to the seller signature', async () => {
    const app = bootstrap('1.0', { initialEstado: '6' })
    const veiculo = (await app.veiculos()).vehicles[0]!

    await expect(app.analise(veiculo.plate, veiculo.renavam)).resolves.toMatchObject({
      hasActiveTDV: true,
      estado: '6',
      proximaAcao: 'vendedor_2'
    })
  })
})

describe('TdvMockStore — TDV 2.0 (origem 2 e 3)', () => {
  it('lists both comunicações de venda in estado 7 with no codigo', async () => {
    const app = bootstrap('2.0')
    const { vehicles } = await app.compras()

    expect(vehicles).toHaveLength(2)
    expect(vehicles.map(v => v.origem)).toEqual(['2', '3'])
    expect(vehicles.map(v => v.origemComunicacaoVendaVeiculo)).toEqual(['9', '8'])
    // The sale was signed outside the app, so the CV already reports estado 7 — and still has
    // no codigoTransferenciaVeiculo, which is what sends the buyer down the creation path.
    expect(vehicles.every(v => v.estado === '7')).toBe(true)
    expect(vehicles.every(v => v.codigoTransferencia === '')).toBe(true)
  })

  it('promotes the comunicação de venda to a TDV at estado 7 and stops listing it twice', async () => {
    const app = bootstrap('2.0')
    const cv = (await app.compras()).vehicles[0]!

    const result = await app.criarCompra(compraInputFrom(cv))

    expect(result).toMatchObject({ proximaAcao: 'aviso_pagamento', estado: '7' })

    const depois = (await app.compras()).vehicles
    expect(depois).toHaveLength(2)
    const promovida = depois.find(v => v.plate === cv.plate)!
    expect(promovida.estado).toBe('7')
    expect(promovida.proximaAcao).toBe('comprador_2')
    expect(promovida.codigoTransferencia).toMatch(/^[0-9a-f]{32}$/)
  })

  it('surfaces the seller e-mail the comunicação de venda carries', async () => {
    const app = bootstrap('2.0')
    const cv = (await app.compras()).vehicles[0]!

    expect(cv.emailVendedor).toBe('zecadetran@gmail.com')
  })

  it('reproduces a pendência exactly as the real API reports it', async () => {
    const app = bootstrap('2.0', { pendencia: 'administrativa_pendente' })
    const cv = (await app.compras()).vehicles[0]!

    await expect(app.criarCompra(compraInputFrom(cv))).resolves.toMatchObject({
      proximaAcao: 'administrativa_pendente',
      detail: 'Veículo com bloqueio - Baixa permanente'
    })
  })
})

describe('TdvMockStore — TDV 3.0 (origem 4, loja vende ao cidadão)', () => {
  it('lists the CV with a CNPJ seller', async () => {
    const app = bootstrap('3.0')
    const { vehicles } = await app.compras()

    expect(vehicles).toHaveLength(1)
    expect(vehicles[0]).toMatchObject({
      origem: '4',
      codigoVendedor: '16794464003768',
      nomeVendedor: 'CAOA MOTOR DO BRASIL LTDA'
    })
  })

  it('has no vehicle on the seller side — the citizen is the buyer here', async () => {
    const app = bootstrap('3.0')
    await expect(app.veiculos()).resolves.toEqual({ vehicles: [] })
  })
})

describe('TdvMockStore — TDV 4.0 (origem 5, Entrada Renave)', () => {
  it('seeds the intent the dealership opened via SERPRO, with the loja as buyer', async () => {
    const app = bootstrap('4.0')

    // The citizen sells, so nothing shows up on the purchases list.
    await expect(app.compras()).resolves.toEqual({ vehicles: [] })

    const veiculo = (await app.veiculos()).vehicles[0]!
    await expect(app.analise(veiculo.plate, veiculo.renavam)).resolves.toMatchObject({
      hasActiveTDV: true,
      estado: '1',
      origem: '5',
      cpfComprador: '16.794.464/0037-68',
      nomeComprador: 'CAOA MOTOR DO BRASIL LTDA'
    })
  })

  it('routes a seller resuming at estado 6 to their own signature', async () => {
    const app = bootstrap('4.0', { initialEstado: '6' })
    const veiculo = (await app.veiculos()).vehicles[0]!

    await expect(app.analise(veiculo.plate, veiculo.renavam)).resolves.toMatchObject({
      origem: '5',
      proximaAcao: 'vendedor_loja_assinar'
    })
  })
})

describe('TdvMockStore — TDV 6.0 (origem 6, Cartório/SEFAZ)', () => {
  it('lists the cartório CV and passes validar-tdv by default', async () => {
    const app = bootstrap('6.0')
    const cv = (await app.compras()).vehicles[0]!

    // estado 7 with no codigo is the shape a cartório CV really has — and it is what makes the
    // flow's gate (origem 6 AND estado 7) call validar-tdv before creating anything.
    expect(cv).toMatchObject({
      origem: '6',
      origemComunicacaoVendaVeiculo: '4',
      estado: '7',
      codigoTransferencia: ''
    })
    await expect(app.validarTdv({
      placaVeiculo: cv.plate,
      codigoRenavamVeiculo: cv.renavam,
      origem: cv.origem!
    })).resolves.toEqual({ proximaAcao: 'enotariado' })
  })

  it('creates the TDV from the cartório CV after validar-tdv passes', async () => {
    const app = bootstrap('6.0')
    const cv = (await app.compras()).vehicles[0]!

    await expect(app.criarCompra(compraInputFrom(cv))).resolves.toMatchObject({
      proximaAcao: 'aviso_pagamento',
      estado: '7'
    })

    const depois = (await app.compras()).vehicles[0]!
    expect(depois.codigoTransferencia).toMatch(/^[0-9a-f]{32}$/)
  })

  it.each([
    ['duas_assinaturas'],
    ['duas_pessoas_fisicas']
  ] as const)('reproduces the %s rejection', async (falha) => {
    const app = bootstrap('6.0', { validarTdv: falha })
    const cv = (await app.compras()).vehicles[0]!

    await expect(app.validarTdv({
      placaVeiculo: cv.plate,
      codigoRenavamVeiculo: cv.renavam,
      origem: cv.origem!
    })).resolves.toEqual({ proximaAcao: falha })
  })
})

describe('TdvMockStore — configuração dos CPFs', () => {
  it('seeds a buyer journey with only TDV_MOCK_BUYER_CPF set', async () => {
    const app = bootstrap('2.0', { sellerCpf: '' })

    const { vehicles } = await app.compras()
    expect(vehicles).toHaveLength(2)
    expect(vehicles.every(v => v.nomeVendedor !== '')).toBe(true)
  })

  it('seeds a seller journey with only TDV_MOCK_SELLER_CPF set', async () => {
    const app = bootstrap('4.0', { buyerCpf: '' })

    const { vehicles } = await app.veiculos()
    expect(vehicles).toHaveLength(1)
  })

  it('starts empty when the CPF of the played side is missing', async () => {
    const app = bootstrap('2.0', { buyerCpf: '' })

    await expect(app.compras()).resolves.toEqual({ vehicles: [] })
  })
})

describe('TdvMockStore — texto vindo do servidor', () => {
  it('renders the residence self-declaration from the address the buyer confirmed', async () => {
    const app = bootstrap('2.0')

    const { autodeclaracaoResidencia } = await app.autodeclaracao({
      logradouro: 'Rua Juvenal Lira',
      numero: '221',
      complemento: 'CASA 2',
      bairro: 'Jardim Elisa Maria',
      municipio: 'São Paulo',
      uf: 'SP',
      nomeUF: 'São Paulo'
    })

    expect(autodeclaracaoResidencia).toContain('Rua Juvenal Lira nº 221 CASA 2')
    expect(autodeclaracaoResidencia).toContain('MARIA COMPRADORA TESTE')
    expect(autodeclaracaoResidencia).toContain('052.464.876-01')
  })

  it('carries the TCR text on the origem 5 record, the way the seller screen reads it', async () => {
    const app = bootstrap('4.0')
    const veiculo = (await app.veiculos()).vehicles[0]!

    const result = await app.analise(veiculo.plate, veiculo.renavam)

    expect(result).toMatchObject({ origem: '5' })
    expect((result as { termoCienciaResponsabilidade?: string }).termoCienciaResponsabilidade)
      .toContain('estou transferindo a propriedade do veículo')
  })
})

describe('TdvMockStore — fidelidade dos dados', () => {
  it('returns 11-digit CPFs and 14-digit CNPJs, like the documented API responses', async () => {
    const cidadao = bootstrap('2.0')
    expect((await cidadao.compras()).vehicles[0]?.codigoVendedor).toHaveLength(11)

    const loja = bootstrap('3.0')
    expect((await loja.compras()).vehicles[0]?.codigoVendedor).toHaveLength(14)
  })

  it('raises TDVAtivaExistenteError on a second create, in the envelope the services match on', async () => {
    const app = bootstrap('2.0')
    const cv = (await app.compras()).vehicles[0]!
    await app.criarCompra(compraInputFrom(cv))

    // Straight at the store: the mock must reject, and with the real error shape.
    expect(() => tdvMockStore.createTdv({
      placaVeiculo: cv.plate,
      codigoRenavamVeiculo: cv.renavam,
      nomeVendedor: cv.nomeVendedor,
      codigoVendedor: cv.codigoVendedor!,
      origem: cv.origem!
    })).toThrowError(expect.objectContaining({
      name: 'DetranSpServiceNowError',
      status: 406,
      type: 'TDVAtivaExistenteError',
      detail: 'Já existe uma TDV ativa para o veículo',
      responseData: {
        error: { message: 'TDVAtivaExistenteError', detail: 'Já existe uma TDV ativa para o veículo' },
        status: 'failure'
      }
    }))

    // And CriarCompraService recovers from it by resolving the existing code.
    await expect(app.criarCompra(compraInputFrom(cv))).resolves.toMatchObject({ estado: '7' })
  })
})
