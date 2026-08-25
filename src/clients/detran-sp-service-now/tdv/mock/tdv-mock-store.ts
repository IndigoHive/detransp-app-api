import type { Config } from '../../../../types'
import { formatCpf } from '../../../../utils/format-document'
import { CodigoEstadoQRCode, CodigoEstadoTDV, CodigoOrigemTDV } from '../types'
import type {
  AtualizaTdvCommand,
  BuscaCidadaoResultData,
  BuscaDebitosTdvResultSuccess,
  BuscaEnderecoResultData,
  BuscaPixQrCodeTdvResultSuccess,
  CriaAutodeclaracaoResidenciaCommand,
  CriaTdvCommand,
  ListTdvsQuery,
  ListaTdvsResultData,
  ListaVeiculosProprietarioResultData
} from '../types'
import { throwTdvMockError } from './service-now-mock-error'
import {
  buildRecord,
  MOCK_MUNICIPIO,
  numeroTransferencia,
  primaryVehicle,
  seedSpecs,
  sysId,
  toListaVeiculos,
  type MockTdvRecord,
  type SeedSpec
} from './tdv-mock-seeds'

type TdvMockConfig = Config['tdvMock']

const MUNICIPIO_NOME = MOCK_MUNICIPIO.nome
const MUNICIPIO_CODIGO = MOCK_MUNICIPIO.codigo
const MUNICIPIO_IBGE = MOCK_MUNICIPIO.ibge

// Journeys where the sale was registered outside the app: creating the TDV from the comunicação
// de venda lands straight on estado 7 (ATPV-e assinada e CV gerada), because both parties already
// signed elsewhere — there is no in-app signature step to walk through.
const ORIGENS_COMUNICACAO_VENDA_EXTERNA: readonly string[] = [
  CodigoOrigemTDV.E_NOTARIADO,
  CodigoOrigemTDV.CDT,
  CodigoOrigemTDV.RENAVE,
  CodigoOrigemTDV.CARTORIO
]

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
  private readonly tdvs = new Map<string, MockTdvRecord>()
  // Comunicações de venda that have no TDV behind them yet — listed for the buyer, but with no
  // codigoTransferenciaVeiculo, so they cannot live in `tdvs` (which is keyed by that code).
  private comunicacoesVenda: MockTdvRecord[] = []
  private readonly pixByTdv = new Map<string, PixMockState>()
  private seeded = false
  private cfg: TdvMockConfig = {
    enabled: false,
    versao: '1.0',
    sellerCpf: '',
    buyerCpf: '',
    vehiclePlate: '',
    vehicleRenavam: '',
    initialEstado: '',
    forceVehicleRestriction: false,
    forceCidadesDiferentes: false,
    pendencia: '',
    validarTdv: ''
  }
  private specs: SeedSpec[] = []

  // Seeds the module-level mass once (idempotent — later calls no-op) with the records
  // ServiceNow would return for `cfg.versao`. TDV_MOCK_INITIAL_ESTADO overrides where each
  // record starts; without it every version starts where its journey really begins — empty for
  // TDV 1.0, a bare comunicação de venda for 2.0/3.0/6.0, estado 1 for 4.0.
  ensureSeeded (cfg: TdvMockConfig): { versao: string; records: MockTdvRecord[] } | null {
    if (this.seeded) return null
    this.cfg = cfg
    this.seeded = true
    this.specs = seedSpecs(cfg)

    if (!cfg.sellerCpf || !cfg.buyerCpf) {
      console.warn('⚠️  TDV_MOCK_SELLER_CPF/TDV_MOCK_BUYER_CPF não configurados — massa inicia vazia.')
      return null
    }

    const estadoForcado = this.resolveInitialEstado(cfg)
    const records: MockTdvRecord[] = []

    for (const spec of this.specs) {
      const estado = estadoForcado ?? spec.estadoPadrao
      // TDV 1.0 with no forced estado has nothing to seed: the seller starts from an empty slate.
      if (estado === undefined && spec.jornada === 'vendedor') continue

      // The "estado without codigo" shape only makes sense for the seeded default; a forced
      // TDV_MOCK_INITIAL_ESTADO means the tester wants a real TDV at that state.
      const record = buildRecord(spec, estado, {
        semCodigo: spec.estadoSemCodigo === true && estadoForcado === undefined
      })
      if (record.codigoTransferenciaVeiculo) {
        this.tdvs.set(record.codigoTransferenciaVeiculo, record)
      } else {
        this.comunicacoesVenda.push(record)
      }
      records.push(record)
    }

    return records.length ? { versao: cfg.versao, records } : null
  }

  private resolveInitialEstado (cfg: TdvMockConfig): CodigoEstadoTDV | undefined {
    if (!cfg.initialEstado) return undefined
    if (!VALID_ESTADOS.has(cfg.initialEstado)) {
      console.warn(`⚠️  TDV_MOCK_INITIAL_ESTADO="${cfg.initialEstado}" inválido (use um código de 1 a 10) — ignorando.`)
      return undefined
    }
    return cfg.initialEstado as CodigoEstadoTDV
  }

  reset (): void {
    this.tdvs.clear()
    this.comunicacoesVenda = []
    this.pixByTdv.clear()
    this.seeded = false
    this.specs = []
  }

  // Only the versions where the citizen is the seller (TDV 1.0 and 4.0) put a vehicle in their
  // name — on the buyer-side versions the seller is someone else, so "Sou vendedor" correctly
  // hits the empty-state screen.
  getVehicles (cpf?: string): ListaVeiculosProprietarioResultData[] {
    const spec = this.specs.find(s => s.jornada === 'vendedor')
    if (!spec) return []
    if (cpf && this.cfg.sellerCpf && cpf !== this.cfg.sellerCpf) return []
    return [toListaVeiculos(spec.vehicle, spec.vendedor.nome)]
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

  // Mirrors the wording ServiceNow renders — the screen shows this verbatim, so a mock that
  // returned a placeholder would hide layout problems the real text causes.
  getAutodeclaracao (cpf: string, endereco: CriaAutodeclaracaoResidenciaCommand): string {
    const nome = this.getCitizen(cpf).nome
    const complemento = endereco.complemento ? ` ${endereco.complemento}` : ''
    return [
      `Eu, ${nome}, inscrito no CPF sob o nº ${formatCpf(cpf)}, declaro para os devidos fins`,
      ` que resido em ${endereco.logradouro} nº ${endereco.numero}${complemento},`,
      ` Bairro ${endereco.bairro}, no município de ${endereco.municipio},`,
      ` no estado de ${endereco.nomeUF || endereco.uf}.`,
      '\nSob pena da lei, estou ciente de que a falsidade destas informações implicará em penalidades.'
    ].join('')
  }

  listTdvs (query: ListTdvsQuery): ListaTdvsResultData[] {
    // Comunicações de venda are listed alongside real TDVs — that is exactly what the buyer
    // journeys of TDV 2.0/3.0/6.0 pick from before any TDV exists.
    const candidates = [...this.tdvs.values(), ...this.comunicacoesVenda]

    return candidates.filter(tdv => {
      if (query.ativa === 'true' && tdv.ativa !== '1') return false
      if (query.ativa === 'false' && tdv.ativa !== '0') return false
      if (query.codigoVendedor && tdv.codigoVendedor !== query.codigoVendedor) return false
      if (query.codigoComprador && tdv.codigoComprador !== query.codigoComprador) return false
      if (query.placaVeiculo && tdv.placaVeiculo !== query.placaVeiculo) return false
      return true
    })
  }

  getTdv (codigo: string): MockTdvRecord | undefined {
    return this.tdvs.get(codigo)
  }

  createTdv (command: CriaTdvCommand): MockTdvRecord {
    // Opt-in failure: reproduces the pendência the real API raises when the vehicle is not
    // clear to transfer, so the buyer-journey pendência screens can be reached.
    if (this.cfg.pendencia) throwTdvMockError(this.cfg.pendencia)

    const jaAtiva = [...this.tdvs.values()].find(tdv =>
      tdv.ativa === '1'
      && tdv.placaVeiculo === command.placaVeiculo
      && tdv.estado !== CodigoEstadoTDV.TRANSFERENCIA_CANCELADA
    )
    if (jaAtiva) throwTdvMockError('tdv_ativa_existente')

    const externa = ORIGENS_COMUNICACAO_VENDA_EXTERNA.includes(command.origem ?? '')
    const pendente = this.takeComunicacaoVenda(command)

    // A comunicação de venda is not created from nothing — it is promoted in place, keeping the
    // notary's data and gaining the code and estado the TDV now has.
    const record: MockTdvRecord = pendente ?? this.buildRecordFromCommand(command)

    record.codigoTransferenciaVeiculo = sysId()
    record.numeroTransferenciaVeiculo = numeroTransferencia()
    record.ativa = '1'
    record.estado = externa
      ? CodigoEstadoTDV.ATPVE_ASSINADA_VENDEDOR_COMUNICACAO_VENDA_GERADA
      : CodigoEstadoTDV.VEICULO_SELECIONADO

    this.applyCommandFields(record, command)

    if (externa) {
      record.numeroAtpveVeiculo ??= '243763996337278'
      record.codigoAnexoAtpve ??= sysId()
      record.codigoAnexoAssinaturaComprador ??= sysId()
      record.codigoAnexoAssinaturaVendedor ??= sysId()
      record.dataInicialPagamento ??= new Date().toISOString()
    }

    this.tdvs.set(record.codigoTransferenciaVeiculo, record)
    return record
  }

  // Pulls the matching comunicação de venda out of the pending list, so it is not listed twice
  // once it has become a TDV.
  private takeComunicacaoVenda (command: CriaTdvCommand): MockTdvRecord | undefined {
    const index = this.comunicacoesVenda.findIndex(cv =>
      cv.placaVeiculo === command.placaVeiculo
      && cv.codigoRenavamVeiculo === command.codigoRenavamVeiculo
    )
    if (index < 0) return undefined
    return this.comunicacoesVenda.splice(index, 1)[0]
  }

  private buildRecordFromCommand (command: CriaTdvCommand): MockTdvRecord {
    const spec = this.specs[0]!
    const vehicle = primaryVehicle(this.cfg)

    // The buyer journeys echo the whole listed record back, so every field here is optional from
    // the type's point of view — fall back to the seeded vehicle/seller when one is missing.
    return buildRecord(
      {
        ...spec,
        ...(command.origem ? { origem: command.origem } : {}),
        vehicle: {
          ...vehicle,
          placa: command.placaVeiculo ?? vehicle.placa,
          codigoRenavam: command.codigoRenavamVeiculo ?? vehicle.codigoRenavam,
          ...(command.chassiVeiculo ? { chassi: command.chassiVeiculo } : {})
        },
        vendedor: {
          codigo: command.codigoVendedor ?? spec.vendedor?.codigo ?? '',
          nome: command.nomeVendedor ?? spec.vendedor?.nome ?? '',
          email: command.emailVendedor ?? ''
        }
      },
      undefined
    )
  }

  // Everything the caller actually sent wins over the seeded values — a wrong or missing field
  // in a service payload has to show up here, not be papered over by the seed.
  private applyCommandFields (record: MockTdvRecord, command: CriaTdvCommand): void {
    const source = command as unknown as Record<string, unknown>
    const overridable = [
      ...MERGEABLE_TDV_FIELDS,
      'origem',
      'origemComunicacaoVendaVeiculo',
      'descricaoMarcaVeiculo',
      'nomeVendedor',
      'emailVendedor',
      'codigoVendedor',
      'nomeMunicipioVeiculo',
      'nomeMunicipioComprador',
      'chassiVeiculo',
      'kmVistoriadaVeiculo',
      'confirmacaoAutodeclaracaoResidenciaComprador'
    ] as const

    for (const field of overridable) {
      const value = source[field]
      if (value !== undefined && value !== '') {
        (record as Record<string, unknown>)[field] = value
      }
    }

    if (command.cepComprador) {
      record.nomeMunicipioComprador ??= MUNICIPIO_NOME
      record.codigoMunicipioComprador ??= MUNICIPIO_CODIGO
      record.ufComprador ??= 'SP'
    }
  }

  // Returns the previous estado (for logging) and the mutated record, or null if unknown codigo.
  updateTdv (codigo: string, data: AtualizaTdvCommand): { previousEstado?: CodigoEstadoTDV | undefined; record: MockTdvRecord } | null {
    const record = this.tdvs.get(codigo)
    if (!record) return null

    const previousEstado = record.estado
    const source = data as Record<string, unknown>

    if (data.estado !== undefined) {
      record.estado = data.estado
    }

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

    if (source.confirmacaoTermoCienciaResponsabilidade !== undefined) {
      const confirmed = source.confirmacaoTermoCienciaResponsabilidade === true
        || source.confirmacaoTermoCienciaResponsabilidade === 'true'
        || source.confirmacaoTermoCienciaResponsabilidade === '1'
      record.confirmacaoTermoCienciaResponsabilidade = confirmed ? '1' : '0'
      if (confirmed) {
        record.codigoAnexoTermoCienciaResponsabilidade ??= 'MOCK-ANEXO-TCR'
      }
    }

    return { previousEstado, record }
  }

  // Simulates the DETRAN ServiceNow cron worker that (in real homolog/prod) advances a paid TDV
  // from state 8 to state 9 asynchronously, outside of any client-triggered request — no service
  // in this codebase ever sends estado 9 via AtualizaTdvCommand, so this bypasses that type on
  // purpose. Only called by the mock client's auto-conclusao timer.
  forceEstado (codigo: string, estado: CodigoEstadoTDV): { previousEstado?: CodigoEstadoTDV | undefined; record: MockTdvRecord } | null {
    const record = this.tdvs.get(codigo)
    if (!record) return null

    const previousEstado = record.estado
    record.estado = estado
    return { previousEstado, record }
  }

  getDebitos (): BuscaDebitosTdvResultSuccess {
    const debitos = [
      { descricao: 'Transferência de Veículo', valor: 295.83 },
      { descricao: 'Licenciamento', valor: 648.41 },
      { descricao: 'IPVA 2026', valor: 303.62 },
      { descricao: 'IPVA 2025', valor: 329.08 },
      { descricao: 'IPVA 2024', valor: 335.13 },
      { descricao: 'IPVA 2023', valor: 427.56 },
      { descricao: 'IPVA 2022', valor: 427.40 },
      { descricao: 'IPVA 2021', valor: 355.20 }
    ]

    return {
      result: {
        valorTotal: Number(debitos.reduce((total, debito) => total + debito.valor, 0).toFixed(2)),
        debitos
      }
    }
  }

  getPixQrCode (codigo: string, forcarNovo: boolean): BuscaPixQrCodeTdvResultSuccess | undefined {
    let pix = this.pixByTdv.get(codigo)

    // Mirrors real forcarNovo semantics: forcarNovo=false only reads an existing charge, it
    // never mints one — the débitos-list screen calls with this false so the PIX's short
    // expiration window doesn't start ticking before the buyer ever reaches the QR screen.
    if (!pix && !forcarNovo) {
      return undefined
    }

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
