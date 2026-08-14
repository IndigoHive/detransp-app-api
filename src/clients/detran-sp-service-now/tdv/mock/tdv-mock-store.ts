import type { Config } from '../../../../types'
import { CodigoEstadoQRCode, CodigoEstadoTDV } from '../types'
import type {
  AtualizaTdvCommand,
  BuscaCidadaoResultData,
  BuscaDebitosTdvResultSuccess,
  BuscaEnderecoResultData,
  BuscaPixQrCodeTdvResultSuccess,
  BuscaTdvResultData,
  CriaTdvCommand,
  ListTdvsQuery,
  ListaTdvsResultData,
  ListaVeiculosProprietarioResultData
} from '../types'

type TdvMockConfig = Config['tdvMock']

// A single São Paulo municipality is used for both the seeded vehicle and every buyer address,
// so ValidacaoVendaService always resolves to cidadesDiferentes: false on the happy path.
const MUNICIPIO_NOME = 'SAO PAULO'
const MUNICIPIO_CODIGO = '9668'
const MUNICIPIO_IBGE = 3550308

// Fixed alongside the seeded vehicle's brand/model — real ServiceNow TDV records carry
// descricaoCorVeiculo, but it isn't part of CriaTdvCommand, so it's set here like descricaoMarca.
const VEHICLE_COLOR = 'BRANCA'

// Fields the AtualizaTdv discriminated union may carry onto the stored TDV record. Copied over
// generically on each update so the mock doesn't need a branch per transition type.
const MERGEABLE_TDV_FIELDS = [
  'codigoComprador',
  'nomeComprador',
  'emailComprador',
  'cepComprador',
  'bairroComprador',
  'logradouroComprador',
  'numeroComprador',
  'complementoComprador',
  'valorVendaVeiculo',
  'kmVeiculo',
  'autodeclaracaoResidenciaComprador'
] as const

// Optimistic-flow tuning: keep the PIX "aguardando pagamento" screen visible for a bit instead
// of reporting PAGO on the very first request, so the debits/QR screen actually renders before
// ConsultaDebitosService accelerates the TDV to state 8.
const PIX_AUTO_PAY_DELAY_MS = 3000

type PixMockState = {
  idQRCode: string
  qrCode: string
  dataExpiracaoQRCode: string
  createdAt: number
}

// Each member access below is inlined to its string literal by the compiler (CodigoEstadoTDV is
// a const enum), so this Set has no runtime dependency on the enum itself — safe to use for
// validating a raw TDV_MOCK_INITIAL_ESTADO string from env.
const VALID_ESTADOS: ReadonlySet<string> = new Set([
  CodigoEstadoTDV.VEICULO_SELECIONADO,
  CodigoEstadoTDV.DADOS_VENDA_INFORMADOS,
  CodigoEstadoTDV.ATPVE_CRIADA,
  CodigoEstadoTDV.INTENCAO_COMPRA_CONFIRMADA,
  CodigoEstadoTDV.AUTODECLARACAO_RESIDENCIA_CONFIRMADA,
  CodigoEstadoTDV.ATPVE_ASSINADA_COMPRADOR,
  CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA,
  CodigoEstadoTDV.TAXA_SERVICO_PAGA,
  CodigoEstadoTDV.TRANSFERENCIA_CONCLUIDA,
  CodigoEstadoTDV.TRANSFERENCIA_CANCELADA
])

/**
 * Process-global, in-memory, stateful store backing the TDV mock. Registered nowhere in DI —
 * it is a module singleton on purpose, because the mock client is resolved `.scoped()` (a fresh
 * instance per request) and the test mass must survive across requests and across seller/buyer
 * logins for the full flow to be exercised. Note: a `tsx watch` reload resets everything.
 */
export class TdvMockStore {
  private readonly tdvs = new Map<string, BuscaTdvResultData>()
  private readonly pixByTdv = new Map<string, PixMockState>()
  private seeded = false
  private cfg: TdvMockConfig = {
    enabled: false,
    sellerCpf: '',
    buyerCpf: '',
    vehiclePlate: 'ABC1D23',
    vehicleRenavam: '12345678901',
    initialEstado: ''
  }
  private counter = 0

  // Seeds the module-level mass once (idempotent — later calls no-op). When
  // `cfg.initialEstado` is set, also creates one TDV already at that state (seller, buyer, and
  // sale data pre-filled) so a single step of the flow can be tested directly. Returns the
  // created record only the one time it's actually created, so the caller can log it once.
  ensureSeeded (cfg: TdvMockConfig): { record: BuscaTdvResultData } | null {
    if (this.seeded) return null
    this.cfg = cfg
    this.seeded = true

    if (!cfg.initialEstado) return null

    if (!VALID_ESTADOS.has(cfg.initialEstado)) {
      console.warn(`⚠️  TDV_MOCK_INITIAL_ESTADO="${cfg.initialEstado}" inválido (use um código de 1 a 10) — ignorando, massa inicia vazia.`)
      return null
    }

    if (!cfg.sellerCpf || !cfg.buyerCpf) {
      console.warn('⚠️  TDV_MOCK_INITIAL_ESTADO definido, mas TDV_MOCK_SELLER_CPF/TDV_MOCK_BUYER_CPF não configurados — ignorando, massa inicia vazia.')
      return null
    }

    const record = this.buildSeedTdv(cfg.initialEstado as CodigoEstadoTDV)
    this.tdvs.set(record.codigoTransferenciaVeiculo!, record)
    return { record }
  }

  // Builds a TDV as if it had organically progressed through the flow up to `estado` — seller,
  // buyer, sale data, and address fields are all pre-filled the same way updateTdv would have
  // left them, so any endpoint for that state (or later) works without missing-data errors.
  private buildSeedTdv (estado: CodigoEstadoTDV): BuscaTdvResultData {
    const codigo = `TDV-MOCK-${String(++this.counter).padStart(4, '0')}`
    const vehicle = this.buildVehicle()
    const comprador = this.getCitizen(this.cfg.buyerCpf)

    return {
      ativa: estado === CodigoEstadoTDV.TRANSFERENCIA_CANCELADA ? '0' : '1',
      estado,
      codigoTransferenciaVeiculo: codigo,
      placaVeiculo: vehicle.placa,
      placaMercosul: vehicle.placaMercosul,
      descricaoMarcaVeiculo: vehicle.descricaoMarca,
      descricaoCorVeiculo: VEHICLE_COLOR,
      codigoRenavamVeiculo: vehicle.codigoRenavam,
      codigoMunicipioVeiculo: vehicle.codigoMunicipio,
      nomeMunicipioVeiculo: vehicle.nomeMunicipio,
      codigoVendedor: this.cfg.sellerCpf,
      nomeVendedor: 'VENDEDOR TESTE',
      emailVendedor: 'vendedor.teste@example.com',
      // Pre-vistoriado so InformarDadosVendaService's km guard passes for any km >= 10000.
      kmVistoriadaVeiculo: '10000',
      codigoComprador: this.cfg.buyerCpf,
      nomeComprador: comprador.nome,
      emailComprador: 'comprador.teste@example.com',
      cepComprador: comprador.cep,
      bairroComprador: comprador.bairro,
      logradouroComprador: `${comprador.tipoLogradouro} ${comprador.logradouro}`.trim(),
      numeroComprador: comprador.numeroLogradouro,
      complementoComprador: '',
      valorVendaVeiculo: '50000',
      kmVeiculo: '55000',
      nomeMunicipioComprador: MUNICIPIO_NOME,
      codigoMunicipioComprador: MUNICIPIO_CODIGO,
      ufComprador: 'SP'
    }
  }

  reset (): void {
    this.tdvs.clear()
    this.pixByTdv.clear()
    this.seeded = false
    this.counter = 0
  }

  private buildVehicle (): ListaVeiculosProprietarioResultData {
    return {
      placa: this.cfg.vehiclePlate,
      placaMercosul: 'true',
      nomeProprietario: 'VENDEDOR TESTE',
      chassi: '9BWZZZ377VT004251',
      codigoRenavam: this.cfg.vehicleRenavam,
      codigoMunicipio: MUNICIPIO_CODIGO,
      nomeMunicipio: MUNICIPIO_NOME,
      codigoMarca: '1',
      descricaoMarca: 'FIAT/ARGO DRIVE 1.0',
      anoFabricacao: '2021',
      anoModelo: '2022',
      anoExercicio: '2025',
      dataEmissao: '2022-01-10',
      uf: 'SP'
    }
  }

  // Empty when the caller is the seeded buyer, so switching to "Sou vendedor" with the buyer's
  // CPF exercises the empty-state screen instead of always finding a vehicle to sell.
  getVehicles (cpf?: string): ListaVeiculosProprietarioResultData[] {
    if (cpf && this.cfg.buyerCpf && cpf === this.cfg.buyerCpf) return []
    return [this.buildVehicle()]
  }

  getCitizen (cpf: string): BuscaCidadaoResultData {
    const nome = cpf && cpf === this.cfg.buyerCpf ? 'MARIA COMPRADORA TESTE' : 'COMPRADOR TESTE'
    return {
      cpf,
      nome,
      nomeMae: 'MARIA MAE TESTE',
      dataNascimento: '1990-01-01',
      logradouro: 'DAS FLORES',
      tipoLogradouro: 'RUA',
      numeroLogradouro: '100',
      complemento: '',
      cep: '01001000',
      bairro: 'CENTRO',
      uf: 'SP',
      telefone: '11999999999',
      codMunicipio: MUNICIPIO_CODIGO
    }
  }

  getEndereco (cep: string): BuscaEnderecoResultData {
    return {
      cep,
      bairro: 'CENTRO',
      tipoLogradouro: 'RUA',
      endereco: 'DAS FLORES',
      complemento: null,
      localidade: MUNICIPIO_NOME,
      estado: 'São Paulo',
      uf: 'SP',
      numeroIBGE: MUNICIPIO_IBGE,
      logradouro: 'Rua das Flores',
      municipio: MUNICIPIO_NOME,
      codigoMunicipio: MUNICIPIO_IBGE
    }
  }

  listTdvs (query: ListTdvsQuery): ListaTdvsResultData[] {
    return [...this.tdvs.values()].filter(tdv => {
      if (query.ativa === 'true' && tdv.ativa !== '1') return false
      if (query.ativa === 'false' && tdv.ativa !== '0') return false
      if (query.codigoVendedor && tdv.codigoVendedor !== query.codigoVendedor) return false
      if (query.codigoComprador && tdv.codigoComprador !== query.codigoComprador) return false
      if (query.placaVeiculo && tdv.placaVeiculo !== query.placaVeiculo) return false
      return true
    })
  }

  getTdv (codigo: string): BuscaTdvResultData | undefined {
    return this.tdvs.get(codigo)
  }

  createTdv (command: CriaTdvCommand): BuscaTdvResultData {
    const codigo = `TDV-MOCK-${String(++this.counter).padStart(4, '0')}`
    const vehicle = this.buildVehicle()

    const record: BuscaTdvResultData = {
      ativa: '1',
      estado: CodigoEstadoTDV.VEICULO_SELECIONADO,
      codigoTransferenciaVeiculo: codigo,
      placaVeiculo: command.placaVeiculo,
      placaMercosul: 'true',
      descricaoMarcaVeiculo: vehicle.descricaoMarca,
      descricaoCorVeiculo: VEHICLE_COLOR,
      codigoRenavamVeiculo: command.codigoRenavamVeiculo,
      codigoMunicipioVeiculo: MUNICIPIO_CODIGO,
      nomeMunicipioVeiculo: MUNICIPIO_NOME,
      codigoVendedor: command.codigoVendedor,
      nomeVendedor: command.nomeVendedor || 'VENDEDOR TESTE',
      emailVendedor: command.emailVendedor,
      // Pre-vistoriado so InformarDadosVendaService's km guard passes for any km >= 10000.
      kmVistoriadaVeiculo: '10000'
    }

    this.tdvs.set(codigo, record)
    return record
  }

  // Returns the previous estado (for logging) and the mutated record, or null if unknown codigo.
  updateTdv (codigo: string, data: AtualizaTdvCommand): { previousEstado?: CodigoEstadoTDV | undefined; record: BuscaTdvResultData } | null {
    const record = this.tdvs.get(codigo)
    if (!record) return null

    const previousEstado = record.estado
    const source = data as Record<string, unknown>

    record.estado = data.estado

    for (const field of MERGEABLE_TDV_FIELDS) {
      if (source[field] !== undefined) {
        (record as Record<string, unknown>)[field] = source[field]
      }
    }

    // When the sale data (buyer) is informed, backfill the buyer municipality so the buyer
    // address renders fully in ConfirmarCompraService's response.
    if (source.codigoComprador !== undefined) {
      record.nomeMunicipioComprador = MUNICIPIO_NOME
      record.codigoMunicipioComprador = MUNICIPIO_CODIGO
      record.ufComprador = 'SP'
    }

    if (source.ativa !== undefined) {
      record.ativa = source.ativa === 'false' ? '0' : '1'
    }

    return { previousEstado, record }
  }

  // Simulates the DETRAN ServiceNow cron worker that (in real homolog/prod) advances a paid TDV
  // from state 8 to state 9 asynchronously, outside of any client-triggered request — no service
  // in this codebase ever sends estado 9 via AtualizaTdvCommand, so this bypasses that type on
  // purpose. Only called by the mock client's auto-conclusao timer.
  forceEstado (codigo: string, estado: CodigoEstadoTDV): { previousEstado?: CodigoEstadoTDV | undefined; record: BuscaTdvResultData } | null {
    const record = this.tdvs.get(codigo)
    if (!record) return null

    const previousEstado = record.estado
    record.estado = estado
    return { previousEstado, record }
  }

  getDebitos (): BuscaDebitosTdvResultSuccess {
    return {
      result: {
        valorTotal: 234.56,
        debitos: [
          { descricao: 'Taxa de Transferência', valor: 200.00 },
          { descricao: 'Licenciamento', valor: 34.56 }
        ]
      }
    }
  }

  getPixQrCode (codigo: string): BuscaPixQrCodeTdvResultSuccess {
    let pix = this.pixByTdv.get(codigo)

    // Idempotent like the real forcarNovo semantics: the same QR/txid is reused across polls for
    // a given TDV, only its paid status changes over time.
    if (!pix) {
      const now = Date.now()
      pix = {
        idQRCode: `MOCK-QR-${codigo}`,
        qrCode: '00020126MOCKPIXTDVHOMOLOG5204000053039865802BR6009SAO PAULO62070503***6304MOCK',
        dataExpiracaoQRCode: new Date(now + 60 * 60 * 1000).toISOString(),
        createdAt: now
      }
      this.pixByTdv.set(codigo, pix)
    }

    const paid = Date.now() - pix.createdAt >= PIX_AUTO_PAY_DELAY_MS

    return {
      result: {
        idQRCode: pix.idQRCode,
        qrCode: pix.qrCode,
        dataExpiracaoQRCode: pix.dataExpiracaoQRCode,
        estadoQRCode: paid ? CodigoEstadoQRCode.PAGO : CodigoEstadoQRCode.ATIVO,
        ...(paid
          ? { idPagamentoQRCode: `MOCK-PAY-${codigo}`, dataPagamentoQRCode: new Date().toISOString() }
          : {})
      }
    }
  }
}

// Module singleton — shared across all request scopes (see class docstring).
export const tdvMockStore = new TdvMockStore()
