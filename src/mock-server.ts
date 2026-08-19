import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// ---------------------------------------------------------------------------
// Flow JSON Loader — reads real flow JSONs from mock-data/ and rewrites
// absolute production URLs to relative paths so the flow engine calls
// this mock server instead of the real Heroku API.
// ---------------------------------------------------------------------------
const API_BASE_URLS_TO_STRIP = [
  'https://detransp-app-api-1990fe11bc9a.herokuapp.com/',
]

function loadFlowJson(filename: string): unknown | null {
  const filePath = path.resolve(__dirname, '..', 'mock-data', filename)
  try {
    let raw = fs.readFileSync(filePath, 'utf-8')
    for (const baseUrl of API_BASE_URLS_TO_STRIP) {
      raw = raw.replaceAll(baseUrl, '')
    }
    return JSON.parse(raw)
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_VEHICLES = [
  {
    id: 'v1',
    plate: 'ABC1D23',
    title: 'TOYOTA COROLLA CROSS XRE',
    type: 'AUTOMOVEL',
    licensingStatus: 'REGULAR' as const,
    brandModel: 'TOYOTA/COROLLA CROSS XRE',
    renavam: '00123456789',
    chassi: '9BWZZZ377VT004251',
    lastLicensing: '2025',
    yearFab: '2023',
    yearMod: '2024',
    licensingExpirationDate: '2026-12-31',
  },
  {
    id: 'v2',
    plate: 'XYZ9E86',
    title: 'HONDA CIVIC TOURING',
    type: 'AUTOMOVEL',
    licensingStatus: 'A VENCER' as const,
    brandModel: 'HONDA/CIVIC TOURING',
    renavam: '00987654321',
    chassi: '9BR53ZEC2P987654',
    lastLicensing: '2024',
    yearFab: '2022',
    yearMod: '2023',
    licensingExpirationDate: '2026-07-15',
  },
  {
    id: 'v3',
    plate: 'QRS4F56',
    title: 'VW GOL 1.0',
    type: 'AUTOMOVEL',
    licensingStatus: 'VENCIDO' as const,
    brandModel: 'VW/GOL 1.0',
    renavam: '00555666777',
    chassi: '9BWZZZ377VT004253',
    lastLicensing: '2023',
    yearFab: '2018',
    yearMod: '2019',
    licensingExpirationDate: '2025-03-31',
  },
]

const MOCK_DEBTS_LICENCIAMENTO = [
  {
    self: 'debt-lic-1',
    tipoServico: 5 as const,
    nomeServico: 'Licenciamento 2026',
    valor: 98.91,
    exercicio: 2026,
  },
]

const MOCK_DEBTS_IPVA = [
  {
    self: 'debt-ipva-1',
    tipoServico: 6 as const,
    nomeServico: 'IPVA 2026 - Cota Única',
    valor: 1850.0,
    exercicio: 2026,
    cota: 0,
  },
  {
    self: 'debt-ipva-2',
    tipoServico: 6 as const,
    nomeServico: 'IPVA 2026 - 1ª Cota',
    valor: 462.5,
    exercicio: 2026,
    cota: 1,
  },
]

const MOCK_DEBTS_MULTA = [
  {
    self: 'debt-multa-1',
    tipoServico: 7 as const,
    nomeServico: 'Multa de Trânsito',
    valor: 293.47,
    autoInfracao: 'SP00012345',
    nomeOrgao: 'DER/SP',
    dataInfracao: '2025-11-15',
  },
]

const MOCK_NOTIFICATIONS = [
  {
    id: 'notif-1',
    codMensagem: 'TDV',
    titulo: 'Taxa paga',
    mensagemCurta: 'Recebemos o pagamento da taxa. Clique para mais detalhes sobre a compra.',
    mensagemLonga: '<p>Recebemos o pagamento da taxa de transferência do veículo placa ABC1D23.</p>',
    dataEnvio: '20/06/2026 - 14:30',
    lida: false,
  },
  {
    id: 'notif-2',
    codMensagem: 'TDV',
    titulo: 'Indicação de comprador',
    mensagemCurta: 'Uma pessoa deseja transferir um veículo para seu nome.',
    mensagemLonga: '<p>Uma pessoa indicou você como comprador(a) do veículo placa XYZ9E87.</p>',
    dataEnvio: '18/06/2026 - 09:15',
    lida: false,
  },
  {
    id: 'notif-3',
    codMensagem: 'GERAL',
    titulo: 'Multa registrada',
    mensagemCurta: 'Foi registrada uma nova multa no veículo placa ABC1D23.',
    mensagemLonga: '<p>Auto de infração: SP00012345. Acesse o app para mais detalhes.</p>',
    dataEnvio: '10/06/2026 - 11:00',
    lida: true,
  },
  {
    id: 'notif-4',
    codMensagem: 'GERAL',
    titulo: 'Bem-vindo ao DETRAN-SP Digital',
    mensagemCurta: 'Seja bem-vindo ao aplicativo oficial do DETRAN-SP.',
    mensagemLonga: '<p>Aqui você pode consultar veículos, pagar débitos, e acessar diversos serviços.</p>',
    dataEnvio: '01/06/2026 - 08:00',
    lida: true,
  },
  {
    id: 'notif-5',
    codMensagem: 'TDV',
    titulo: 'Venda assinada',
    mensagemCurta: 'O vendedor assinou o ATPV-e e a comunicação de venda foi gerada.',
    mensagemLonga: '<p>O vendedor assinou o ATPV-e e a comunicação de venda foi gerada. Você tem 30 dias para pagar a taxa de transferência a contar da data de assinatura do vendedor.</p>',
    dataEnvio: '10/08/2026 - 15:48',
    lida: false,
  },
]

const MOCK_MULTAS = [
  {
    auto: 'SP00012345',
    placa: 'ABC1D23',
    descricao: 'Transitar em velocidade superior à máxima permitida em até 20%',
    pontos: 4,
  },
  {
    auto: 'SP00067890',
    placa: 'XYZ9E87',
    descricao: 'Estacionar em local proibido pela sinalização',
    pontos: 5,
  },
]

// Flow IDs — use the same UUIDs as production so cached app data still works
const FLOW_ID_LICENCIAMENTO = 'c0c69366-6ca0-4af8-9662-216179e06ec3'
const FLOW_ID_TDV = 'b05e6733-0668-48ec-9350-7150db088c47'

const LICENCIAMENTO_FLOW_JSON = loadFlowJson('licenciamento-flow.json')
const TDV_FLOW_JSON = loadFlowJson('tdv-flow.json')

const MOCK_FLOWS = [
  {
    id: FLOW_ID_LICENCIAMENTO,
    name: 'Licenciamento',
    description: 'Realize o licenciamento do seu veículo',
    iconName: 'directions-car',
  },
  {
    id: FLOW_ID_TDV,
    name: 'Transferência de Veículo',
    description: 'Transfira a propriedade do seu veículo',
    iconName: 'swap-horiz',
  },
]

const MOCK_FLOW_VERSIONS: Record<string, { id: string; versionNumber: number; flowJson: unknown }> = {}

if (LICENCIAMENTO_FLOW_JSON) {
  MOCK_FLOW_VERSIONS[FLOW_ID_LICENCIAMENTO] = {
    id: 'flow-version-licenciamento',
    versionNumber: 1,
    flowJson: LICENCIAMENTO_FLOW_JSON,
  }
}

if (TDV_FLOW_JSON) {
  MOCK_FLOW_VERSIONS[FLOW_ID_TDV] = {
    id: 'flow-version-tdv',
    versionNumber: 1,
    flowJson: TDV_FLOW_JSON,
  }
}

// PIX payment state — tracks per-renavam so polling works
const pixPayments: Record<string, { estado: number; comprovante: string | null; confirmedDate: string | null; createdAt: number }> = {}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', mode: 'mock' })
})

// ---------------------------------------------------------------------------
// Auth – GovBR (mocked)
// ---------------------------------------------------------------------------
const MOCK_ACCESS_TOKEN = 'mock-access-token-detransp-12345'

app.post('/api/auth/govbr/authorization-url', (req, res) => {
  const platform = req.body?.platform
  if (!platform) {
    res.status(400).json({ error: 'Field platform is required (android | ios).' })
    return
  }
  res.json({
    codeVerifier: 'mock-code-verifier-abc123',
    authorizationUrl: `http://localhost:3500/api/auth/dev-callback?mock=true&platform=${platform}`,
    clientId: 'mock-client-id',
    redirectUri: 'detransp://auth/callback',
  })
})

app.post('/api/auth/govbr/token', (req, res) => {
  const { code, codeVerifier } = req.body ?? {}
  if (!code || !codeVerifier) {
    res.status(400).json({ error: 'Fields code and codeVerifier are required.' })
    return
  }
  res.json({
    accessToken: MOCK_ACCESS_TOKEN,
    access_token: MOCK_ACCESS_TOKEN,
    refreshToken: 'mock-refresh-token-xyz789',
  })
})

const MOCK_FLOW_USER_INFO = {
  cpf: '123.456.789-00',
  full_name: 'João da Silva Santos',
  email: 'joao.silva@email.com',
  phone_number: '+5511999998888',
}

app.get('/api/auth/govbr/userinfo', (_req, res) => {
  res.json({
    data: {
      sub: '12345678900',
      name: MOCK_FLOW_USER_INFO.full_name,
      email: MOCK_FLOW_USER_INFO.email,
      phone_number: MOCK_FLOW_USER_INFO.phone_number,
      cpf: MOCK_FLOW_USER_INFO.cpf,
      picture: null,
    },
  })
})

app.get('/api/auth/govbr/flow-user-info', (_req, res) => {
  res.json(MOCK_FLOW_USER_INFO)
})

app.post('/api/auth/govbr/logout', (_req, res) => {
  res.status(200).end()
})

app.get('/api/auth/dev-callback', (req, res) => {
  const code = 'mock-authorization-code-' + Date.now()
  res.send(`
    <h2>✅ Login mock realizado com sucesso!</h2>
    <p><strong>Authorization Code:</strong></p>
    <textarea rows="4" cols="80" onclick="this.select()">${code}</textarea>
  `)
})

// ---------------------------------------------------------------------------
// Flows
// ---------------------------------------------------------------------------
app.get('/api/flows', (_req, res) => {
  res.json({ data: MOCK_FLOWS })
})

app.get('/api/flows/:flowId', (req, res) => {
  const flowVersion = MOCK_FLOW_VERSIONS[req.params.flowId]
  if (!flowVersion) {
    res.json({
      data: {
        id: `flow-version-${req.params.flowId}`,
        versionNumber: 1,
        flowJson: {
          screens: [
            {
              id: 'screen-placeholder',
              name: 'Em breve',
              navbar: { id: 'nav-ph', type: 'nav_bar', data: { variant: 'regular', title: 'Serviço', showReturn: true, showClose: true } },
              content: {
                id: 'content-ph',
                type: 'group',
                children: [
                  { id: 'heading-ph', type: 'text_heading', data: { text: 'Serviço em desenvolvimento', align: 'center' } },
                  { id: 'body-ph', type: 'text_body', data: { text: 'Este serviço estará disponível em breve.' } },
                ],
              },
              footer: {
                id: 'footer-ph',
                type: 'group',
                children: [{ id: 'btn-ph', type: 'button', data: { label: 'Fechar' } }],
              },
            },
          ],
          actions: [
            { id: 'start', type: 'start_node' },
            { id: 'end', type: 'end_node' },
          ],
          edges: [
            { sourceId: 'start', targetId: 'screen-placeholder' },
            { sourceId: 'screen-placeholder', targetId: 'end' },
          ],
        },
      },
    })
    return
  }
  res.json({ data: flowVersion })
})

// ---------------------------------------------------------------------------
// Licenciamento
// ---------------------------------------------------------------------------
app.get('/api/licenciamento/veiculos', (_req, res) => {
  res.json({ vehicles: MOCK_VEHICLES })
})

app.post('/api/licenciamento/veiculos/representacao', (req, res) => {
  const { renavam, placa } = req.body ?? {}
  const vehicle = MOCK_VEHICLES.find(v => v.renavam === renavam && v.plate === placa)
  res.json({
    vehicle: vehicle ?? null,
    isRepresentante: !!vehicle,
  })
})

app.post('/api/licenciamento/veiculos/:renavam/verificar', (req, res) => {
  const { renavam } = req.params
  const { placa } = req.body ?? {}
  const vehicle = MOCK_VEHICLES.find(v => v.renavam === renavam)

  if (!vehicle) {
    res.json({
      vehicle: null,
      vigency: 'REGULAR',
      isBlocked: false,
      isGnvBlocked: false,
      hasMultaForaDoSistema: false,
      onlyLicensing: false,
      hasPayableDebts: false,
      isLicensingOverdue: false,
      debts: [],
      totalDebits: 0,
      multasDetail: { items: [], total: 'R$ 0,00' },
    })
    return
  }

  const isVencido = vehicle.licensingStatus === 'VENCIDO'
  const debts = isVencido
    ? [...MOCK_DEBTS_LICENCIAMENTO, ...MOCK_DEBTS_IPVA, ...MOCK_DEBTS_MULTA]
    : vehicle.licensingStatus === 'A VENCER'
      ? [...MOCK_DEBTS_LICENCIAMENTO]
      : []

  const totalDebits = debts.reduce((sum, d) => sum + d.valor, 0)

  res.json({
    vehicle,
    vigency: vehicle.licensingStatus,
    isBlocked: false,
    isGnvBlocked: false,
    hasMultaForaDoSistema: isVencido,
    onlyLicensing: vehicle.licensingStatus === 'A VENCER',
    hasPayableDebts: debts.length > 0,
    isLicensingOverdue: isVencido,
    debts,
    totalDebits,
    multasDetail: isVencido
      ? { items: [{ autoInfracao: 'ABC1D23', nomeOrgao: 'DETRAN', dataInfracao: '2025-01-01', valor: 293.47 }], total: 'R$ 293,47' }
      : { items: [], total: 'R$ 0,00' },
    vehicleAttributes: {
      chassi: '9BR53ZEC2P' + renavam.slice(0, 6),
      yearFab: vehicle.yearFab,
      yearMod: vehicle.yearMod,
      cor: 'PRATA',
      combustivel: 'FLEX',
      tipo: vehicle.type ?? 'AUTOMOVEL',
    },
    restrictions: {
      bloqueioFurtoRoubo: 'NAO',
      restricaoTributaria: isVencido ? 'SIM' : 'NAO',
      restricaoAdministrativa: 'NAO',
      restricaoJudicial: 'NAO',
      restricaoVeiculoGuinchado: 'NAO',
      nomeAgente: null,
    },
  })
})

app.post('/api/licenciamento/veiculos/:renavam/qr-code', (req, res) => {
  const { renavam } = req.params
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()
  const qrCode = `00020126580014br.gov.bcb.pix0136mock-pix-key-${renavam}520400005303986540598.915802BR5925DETRAN SP6009SAO PAULO62140510MOCK${renavam}`

  pixPayments[renavam] = { estado: 1, comprovante: null, confirmedDate: null, createdAt: Date.now() }

  // Auto-confirm payment after 15 seconds to simulate PIX polling
  setTimeout(() => {
    const payment = pixPayments[renavam]
    if (payment && payment.estado === 1) {
      payment.estado = 2
      payment.comprovante = `COMPROVANTE-${renavam}-${Date.now()}`
      payment.confirmedDate = new Date().toISOString()
    }
  }, 15000)

  res.json({ qrCode, expiresAt })
})

app.get('/api/licenciamento/veiculos/:renavam/qr-code', (req, res) => {
  const { renavam } = req.params
  const payment = pixPayments[renavam]
  if (!payment) {
    res.json({ estado: null, comprovante: null, confirmedDate: null })
    return
  }
  res.json(payment)
})

app.get('/api/licenciamento/veiculos/:renavam/crlv-e', (_req, res) => {
  // Return a minimal valid PDF base64 so the app doesn't crash when trying to display
  const minimalPdfBase64 = Buffer.from(
    '%PDF-1.0\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n224\n%%EOF',
  ).toString('base64')

  res.json({ base64: minimalPdfBase64 })
})

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
app.get('/api/dashboard/meus-veiculos', (_req, res) => {
  res.json({
    data: {
      type: 'proprietario',
      id: 'owner-1',
      attributes: { nome: 'João da Silva Santos', cpf: '12345678900' },
      relationships: {
        veiculos: {
          data: MOCK_VEHICLES.map(v => ({ type: 'veiculo', id: v.id })),
        },
      },
    },
    included: MOCK_VEHICLES.map(v => ({
      type: 'veiculo',
      id: v.id,
      attributes: { placa: v.plate, renavam: v.renavam, modelo: v.brandModel },
    })),
    meta: {
      totalDeVeiculos: String(MOCK_VEHICLES.length),
      totalDeDebitos: '2242.38',
    },
  })
})

app.get('/api/dashboard/pontuacao-cnh', (_req, res) => {
  res.json({
    data: {
      attributes: {
        totalPontos: '9',
        situacao: 'ATIVO',
      },
    },
  })
})

app.get('/api/dashboard/dados-condutor', (_req, res) => {
  res.json({
    data: {
      attributes: {
        nome: 'João da Silva Santos',
        cpf: '12345678900',
        numeroRegistro: '04123456789',
        categoria: 'AB',
        municipio: 'SAO PAULO',
        dataVencimento: '2029-08-15',
        situacao: 'ATIVO',
      },
    },
  })
})

app.get('/api/dashboard/debitos-pendentes', (_req, res) => {
  res.json({
    debitos: [...MOCK_DEBTS_LICENCIAMENTO, ...MOCK_DEBTS_IPVA, ...MOCK_DEBTS_MULTA],
    total: 2242.38,
  })
})

app.get('/api/dashboard/detalhes-pontuacao-cnh', (_req, res) => {
  res.json({
    data: {
      attributes: {
        cpf: '12345678900',
        nome: 'João da Silva Santos',
      },
    },
    included: [
      {
        type: 'cnh',
        attributes: {
          totalDePontosAtivosUltimos12Meses: 9,
          dataDeVencimento: '2029-08-15',
          quantidadeProcessosPassiveisRecurso: '0',
          quantidadeMultasPassiveisIndicacao: '1',
          numeroRegistro: '04123456789',
          categoria: 'AB',
          municipio: 'SAO PAULO',
        },
      },
    ],
  })
})

app.get('/api/dashboard/lista-multas', (_req, res) => {
  res.json({ multas: MOCK_MULTAS })
})

app.get('/api/dashboard/multas', (req, res) => {
  const auto = (req.query.auto as string) || ''
  const multa = MOCK_MULTAS.find(m => m.auto === auto)

  res.json({
    data: {
      attributes: {
        placa: multa?.placa ?? 'ABC1D23',
        infracao: multa?.descricao ?? 'Infração não especificada',
        pontuacaoAtribuida: String(multa?.pontos ?? 0),
        autoinfracao: auto,
        data: '2025-11-15',
        hora: '14:30',
        municipio: 'SAO PAULO',
        orgaoAutuador: 'DER/SP',
      },
    },
  })
})

// ---------------------------------------------------------------------------
// Notificações
// ---------------------------------------------------------------------------
app.post('/api/notificacoes/dispositivos', (_req, res) => {
  res.status(201).end()
})

app.put('/api/notificacoes/dispositivos/tags', (_req, res) => {
  res.status(200).end()
})

app.get('/api/notificacoes/badge', (_req, res) => {
  const unread = MOCK_NOTIFICATIONS.filter(n => !n.lida).length
  res.json({ badge: unread })
})

// A listagem da caixa postal não devolve codMensagem nem mensagemLonga
app.get('/api/notificacoes/mensagens', (_req, res) => {
  res.json(MOCK_NOTIFICATIONS.map(mensagem => ({ ...mensagem, codMensagem: null, mensagemLonga: null })))
})

app.get('/api/notificacoes/mensagens/:id', (req, res) => {
  const notification = MOCK_NOTIFICATIONS.find(n => n.id === req.params.id)
  if (!notification) {
    res.status(404).json({ message: 'Mensagem não encontrada.' })
    return
  }
  // Mark as read when fetched
  notification.lida = true
  res.json(notification)
})

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------
app.get('/api/services/get-vehicles', (_req, res) => {
  res.json({
    vehicles: MOCK_VEHICLES.map(v => ({
      plate: v.plate,
      renavam: v.renavam,
      brandModel: v.brandModel,
    })),
  })
})

app.post('/api/services/solicitar-vistoria-em-transito', (req, res) => {
  res.json({
    success: true,
    protocolo: 'VIST-' + Date.now().toString(36).toUpperCase(),
    message: 'Vistoria em trânsito solicitada com sucesso.',
  })
})

// ---------------------------------------------------------------------------
// TDV (Transferência Digital de Veículo)
// ---------------------------------------------------------------------------
const MOCK_TDV_COMPRA_ENDERECO = {
  codigoComprador: '123.456.789-00',
  nomeComprador: 'João da Silva Santos',
  logradouroComprador: 'RUA BOA VISTA',
  numeroComprador: '10',
  complementoComprador: '',
  bairroComprador: 'CENTRO',
  nomeMunicipioComprador: 'SÃO PAULO',
  ufComprador: 'SP',
  cepComprador: '01014001',
  enderecoComprador: 'RUA BOA VISTA, 10, CENTRO, SÃO PAULO - SP, 01014001',
  valorVenda: 'R$ 90.000,00',
  quilometragem: '13.000',
}

function mockTdvCompra (vehicle: {
  id: string
  title: string
  plate: string
  brandModel: string
  renavam: string
  yearFab: string
  yearMod: string
  origem: string
  codigoTransferencia?: string
  ativa?: string
  estado?: string
  proximaAcao?: string
  origemComunicacaoVendaVeiculo?: string
  nomeVendedor?: string
  codigoVendedor?: string
}) {
  return {
    licensingStatus: 'REGULAR',
    licensingExpirationDate: '31/12/2025',
    type: 'Passeio',
    lastLicensing: '10/05/2025',
    codigoTransferencia: '',
    descricaoMarcaVeiculo: vehicle.brandModel,
    descricaoCorVeiculo: 'Branco',
    nomeVendedor: 'João Vendedor',
    codigoVendedor: '11122233344',
    nomeMunicipioVeiculo: 'SAO PAULO',
    ...MOCK_TDV_COMPRA_ENDERECO,
    ...vehicle,
  }
}

const MOCK_TDV_COMPRAS = [
  mockTdvCompra({
    id: 'origem-1',
    title: 'FIAT/ARGO 1.0 (1 · TDV 1.0)',
    plate: 'ABC1A11',
    brandModel: 'FIAT/ARGO 1.0 (1 · TDV 1.0)',
    renavam: '00010020031',
    yearFab: '2021',
    yearMod: '2022',
    origem: '1',
    codigoTransferencia: 'TDV-MOCK-O1',
    estado: '3',
    proximaAcao: 'comprador',
    nomeVendedor: 'Maria Oliveira Souza',
    codigoVendedor: '98765432100',
  }),
  mockTdvCompra({
    id: 'origem-2',
    title: 'HONDA/CIVIC (2 · e-Notariado)',
    plate: 'DEF2B22',
    brandModel: 'HONDA/CIVIC (2 · e-Notariado)',
    renavam: '00010020032',
    yearFab: '2020',
    yearMod: '2021',
    origem: '2',
    origemComunicacaoVendaVeiculo: '9',
    ativa: 'true',
  }),
  mockTdvCompra({
    id: 'origem-3',
    title: 'VW/GOL 1.0 (3 · CDT)',
    plate: 'GHI3C33',
    brandModel: 'VW/GOL 1.0 (3 · CDT)',
    renavam: '00010020033',
    yearFab: '2019',
    yearMod: '2020',
    origem: '3',
    origemComunicacaoVendaVeiculo: '8',
    ativa: 'true',
  }),
  mockTdvCompra({
    id: 'origem-4',
    title: 'TOYOTA/COROLLA (4 · Renave saída)',
    plate: 'JKL4D44',
    brandModel: 'TOYOTA/COROLLA (4 · Renave saída)',
    renavam: '00010020034',
    yearFab: '2022',
    yearMod: '2023',
    origem: '4',
    ativa: 'true',
  }),
  mockTdvCompra({
    id: 'origem-6',
    title: 'CHEV/ONIX (6 · Cartório)',
    plate: 'MNO6E66',
    brandModel: 'CHEV/ONIX (6 · Cartório)',
    renavam: '00010020036',
    yearFab: '2021',
    yearMod: '2022',
    origem: '6',
    origemComunicacaoVendaVeiculo: '4',
    codigoTransferencia: "null",
    estado: '7',
    ativa: 'true',
  }),
]

const MOCK_TDV_ENTRADA_RENAVE = {
  id: 'v-origem-5',
  plate: 'PQR5F55',
  title: 'HYUNDAI/HB20 (5 · Entrada Renave)',
  type: 'AUTOMOVEL',
  licensingStatus: 'REGULAR' as const,
  brandModel: 'HYUNDAI/HB20 (5 · Entrada Renave)',
  renavam: '00010020035',
  chassi: '9BWZZZ377VT004255',
  lastLicensing: '2025',
  yearFab: '2022',
  yearMod: '2023',
  licensingExpirationDate: '2026-12-31',
}

app.get('/api/tdv/veiculos', (_req, res) => {
  const vehicles = [...MOCK_VEHICLES, MOCK_TDV_ENTRADA_RENAVE]
  res.json({
    vehicles: vehicles.map(v => ({
      id: v.id,
      title: v.title,
      plate: v.plate,
      licensingStatus: v.licensingStatus,
      licensingExpirationDate: v.licensingExpirationDate,
      type: v.type,
      brandModel: v.brandModel,
      renavam: v.renavam,
      chassi: v.chassi,
      lastLicensing: v.lastLicensing,
      yearFab: v.yearFab,
      yearMod: v.yearMod,
    })),
  })
})

app.post('/api/tdv/analise-requisitos', (req, res) => {
  const plate = req.body?.selectedVehicle?.plate
  if (plate === MOCK_TDV_ENTRADA_RENAVE.plate) {
    res.json({
      hasActiveTDV: false,
      proximaAcao: 'nova_tdv',
      cpfComprador: '16.794.464/0037-68',
      nomeComprador: 'CAOA MOTOR DO BRASIL LTDA',
      emailComprador: 'CERTIDOCPJ@EMAIL.COM',
      enderecoComprador: 'Avenida Conselheiro Nébias, 240, Encruzilhada, Santos - SP, 11045-001',
      descricaoCorVeiculo: 'BRANCA',
      chassiVeiculo: '9BWZZZ377VT004255',
    })
    return
  }
  res.json({
    hasActiveTDV: false,
  })
})

app.post('/api/tdv/validacao-comprador', (req, res) => {
  res.json({
    nomeComprador: 'Maria Oliveira Souza',
    cpfComprador: '987.654.321-00',
    enderecoComprador: 'Rua das Flores, 123, Jardim Paulista, São Paulo - SP',
  })
})

app.post('/api/tdv/validacao-venda', (req, res) => {
  res.json({
    cidadesDiferentes: false,
  })
})

app.post('/api/tdv/criar', (req, res) => {
  const plate = req.body?.placaVeiculo
  if (plate === MOCK_TDV_ENTRADA_RENAVE.plate) {
    res.status(201).json({
      codigo: 'TDV-MOCK-O5',
      origem: '5',
      cpfComprador: '16.794.464/0037-68',
      nomeComprador: 'CAOA MOTOR DO BRASIL LTDA',
      emailComprador: 'CERTIDOCPJ@EMAIL.COM',
      enderecoComprador: 'Avenida Conselheiro Nébias, 240, Encruzilhada, Santos - SP, 11045-001',
      descricaoCorVeiculo: 'BRANCA',
      chassiVeiculo: '9BWZZZ377VT004255',
    })
    return
  }
  res.status(201).json({
    codigo: 'TDV-' + Date.now().toString(36).toUpperCase(),
    origem: '1',
  })
})

app.post('/api/tdv/informar-dados-venda', (req, res) => {
  res.json({})
})

app.post('/api/tdv/confirmar-intencao-venda', (req, res) => {
  res.json({})
})

app.post('/api/tdv/confirmar-termo-ciencia', (_req, res) => {
  res.json({})
})

app.post('/api/tdv/cancelar', (req, res) => {
  res.json({
    success: true,
    message: 'Transferência cancelada com sucesso.',
  })
})

app.get('/api/tdv/compras', (_req, res) => {
  res.json({ vehicles: MOCK_TDV_COMPRAS })
})

app.post('/api/tdv/confirmar-compra', (req, res) => {
  res.json({
    nomeComprador: 'Maria Oliveira Souza',
    cpfComprador: '987.654.321-00',
    enderecoComprador: 'Rua das Flores, 123, Jardim Paulista, São Paulo - SP',
    origem: '1',
    estado: '5',
    vehicle: MOCK_VEHICLES[0] ? {
      id: MOCK_VEHICLES[0].id,
      plate: MOCK_VEHICLES[0].plate,
      title: MOCK_VEHICLES[0].title,
      licensingStatus: MOCK_VEHICLES[0].licensingStatus,
      brandModel: MOCK_VEHICLES[0].brandModel,
      licensingExpirationDate: MOCK_VEHICLES[0].licensingExpirationDate,
      renavam: MOCK_VEHICLES[0].renavam,
      lastLicensing: MOCK_VEHICLES[0].lastLicensing,
      yearFab: MOCK_VEHICLES[0].yearFab,
      yearMod: MOCK_VEHICLES[0].yearMod,
      valorVenda: 'R$ 90.000,00',
      quilometragem: '13.000',
    } : null,
  })
})

app.post('/api/tdv/criar-compra', (req, res) => {
  const body = req.body ?? {}
  const simularPendencia = body.simularPendencia
  const plate = body.placaVeiculo || 'GHI8J90'
  const brandModel = body.descricaoMarcaVeiculo || 'VW/GOL 1.0'
  const renavam = body.renavamVeiculo || '00010020031'
  const vehicle = {
    id: '1',
    plate,
    title: brandModel,
    licensingStatus: 'REGULAR',
    brandModel,
    licensingExpirationDate: '',
    renavam,
    lastLicensing: '',
    yearFab: '',
    yearMod: '',
  }

  if (typeof simularPendencia === 'string' && simularPendencia) {
    const pendencias: Record<string, { proximaAcao: string, detail: string }> = {
      pagamento_pendente: {
        proximaAcao: 'pagamento_pendente',
        detail: 'Pagamento de taxa não localizado'
      },
      vistoria_pagamento_pendentes: {
        proximaAcao: 'vistoria_pagamento_pendentes',
        detail: 'Pagamento de taxa não localizado,Laudo de vistoria não localizado'
      },
      administrativa_pendente: {
        proximaAcao: 'administrativa_pendente',
        detail: 'Veículo com bloqueio - Baixa permanente'
      },
      judicial_pendente: {
        proximaAcao: 'judicial_pendente',
        detail: 'Veículo com Restrição Judicial'
      },
      administrativa_judicial_pendentes: {
        proximaAcao: 'administrativa_judicial_pendentes',
        detail: 'Veículo com bloqueio - Baixa permanente,Veículo com Restrição Judicial'
      }
    }
    const mapped = pendencias[simularPendencia]
    if (mapped) {
      return res.json({
        ...mapped,
        codigoTransferencia: 'TDV-MOCK-NEW',
        vehicle,
        nomeComprador: body.nomeComprador || 'Maria Compradora',
      })
    }
  }

  const nomeComprador = body.nomeComprador || 'Maria Compradora'
  const codigoTransferencia = 'TDV-MOCK-NEW'

  // Uncomment one return to test each pós-endereço path:
  return res.json({ proximaAcao: 'aviso_pagamento', estado: '7', codigoTransferencia, vehicle, nomeComprador })
  // return res.json({ proximaAcao: 'pagamento_confirmado', estado: '8', codigoTransferencia, vehicle, nomeComprador })
  // return res.json({ proximaAcao: 'concluido', estado: '9', codigoTransferencia, vehicle, nomeComprador })
  // return res.json({ proximaAcao: 'pagamento_pendente', detail: 'Pagamento de taxa não localizado', codigoTransferencia, vehicle, nomeComprador })
  // return res.json({ proximaAcao: 'vistoria_pagamento_pendentes', detail: 'Pagamento de taxa não localizado,Laudo de vistoria não localizado', codigoTransferencia, vehicle })
  // return res.json({ proximaAcao: 'administrativa_pendente', detail: 'Veículo com bloqueio - Baixa permanente', codigoTransferencia, vehicle })
  // return res.json({ proximaAcao: 'judicial_pendente', detail: 'Veículo com Restrição Judicial', codigoTransferencia, vehicle })
  // return res.json({ proximaAcao: 'administrativa_judicial_pendentes', detail: 'Veículo com bloqueio - Baixa permanente,Veículo com Restrição Judicial', codigoTransferencia, vehicle })
  // return res.json({ showSnackbar: { variant: 'error', title: 'Erro', description: 'Estado da transferência inválido para continuar' } })
})

app.post('/api/tdv/validar-tdv', (_req, res) => {
  // Uncomment one return to test each TDV 6.0 path:
  // return res.json({ proximaAcao: 'enotariado' })
  return res.json({ proximaAcao: 'duas_assinaturas' })
  // return res.json({ proximaAcao: 'duas_pessoas_fisicas' })
})

app.get('/api/tdv/link-assinatura-iti', (_req, res) => {
  res.json({
    link: 'https://iti-mock.example/oauth2.0/authorize?client_id=mock&redirect_uri=detransp://iti/callback&response_type=code&scope=sign',
    redirectUri: 'detransp://iti/callback',
  })
})

app.post('/api/tdv/valida-assinatura', (req, res) => {
  res.json({
    valid: true,
  })
})

app.post('/api/tdv/prova-vida', (req, res) => {
  setTimeout(() => {
    res.json({
      codigoProvaVida: 'MOCK-PV-' + Date.now(),
    })
  }, 2000)
})

const tdvPixPayments: Record<string, {
  qrCode: string
  expiresAt: string
  estado: number
  comprovante: string | null
  confirmedDate: string | null
}> = {}

app.get('/api/tdv/consulta-debitos', (req, res) => {
  const codigoTransferencia = (req.query.codigoTransferencia as string) || 'TDV-MOCK'

  if (!tdvPixPayments[codigoTransferencia]) {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()
    const qrCode = `00020126580014br.gov.bcb.pix0136mock-tdv-pix-${codigoTransferencia}520400005303986540364.275802BR5925DETRAN SP6009SAO PAULO`
    tdvPixPayments[codigoTransferencia] = {
      qrCode,
      expiresAt,
      estado: 1,
      comprovante: null,
      confirmedDate: null
    }

    setTimeout(() => {
      const payment = tdvPixPayments[codigoTransferencia]
      if (payment && payment.estado === 1) {
        payment.estado = 2
        payment.comprovante = `PIX-${codigoTransferencia}-${Date.now()}`
        const now = new Date()
        payment.confirmedDate = now.toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).replace(',', '')
      }
    }, 15000)
  }

  const payment = tdvPixPayments[codigoTransferencia]
  res.json({
    nomeComprador: 'Maria Oliveira Souza',
    debitos: [
      { descricao: 'Transferência de Veículo', valor: 243.77, valorFormatado: 'R$ 243,77' },
      { descricao: 'Licenciamento', valor: 120.50, valorFormatado: 'R$ 120,50' }
    ],
    valorTotal: 364.27,
    taxaTransferencia: 'R$ 243,77',
    taxaLicenciamento: 'R$ 120,50',
    totalDebitos: 'R$ 364,27',
    qrCode: payment.qrCode,
    expiresAt: payment.expiresAt,
    estado: payment.estado,
    ...(payment.comprovante ? { comprovante: payment.comprovante } : {}),
    ...(payment.confirmedDate ? { confirmedDate: payment.confirmedDate } : {})
  })
})

app.get('/api/tdv/enderecos/:cep', (req, res) => {
  res.json({
    result: {
      cep: req.params.cep?.replace(/\D/g, '') || '08060283',
      bairro: 'Vila Jacuí',
      tipoLogradouro: 'Rua',
      endereco: 'Aulide Carini',
      complemento: '',
      tipoLogradouroAbrev: 'R',
      enderecoAbrev: 'R Aulide Carini',
      tipoLogradouroAbrevDNE: 'R',
      localidade: 'São Paulo',
      estado: 'São Paulo',
      uf: 'SP',
      numeroIBGE: 3550308,
      logradouro: null,
      cdTipoCEP: 1,
      tipoCEP: 'CEP Padrão',
      municipio: 'São Paulo',
      tipoLocalidade: null,
      codigoMunicipio: 9668,
      codigoLocalRel: 9668,
      latitude: null,
      longitude: null,
      codigoDne: 580843,
      tipoLogradouroDne: 81,
      codigoBairro: 26812
    }
  })
})

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
const PORT = parseInt(process.env.PORT || '3500', 10)

app.listen(PORT, () => {
  console.log('')
  console.log('='.repeat(60))
  console.log('  🚗 DETRAN-SP Mock API Server')
  console.log(`  Running on http://localhost:${PORT}`)
  console.log('  Mode: MOCK (no external dependencies)')
  console.log('='.repeat(60))
  console.log('')
  console.log('Available endpoints:')
  console.log('  Auth:')
  console.log('    POST /api/auth/govbr/authorization-url')
  console.log('    POST /api/auth/govbr/token')
  console.log('    GET  /api/auth/govbr/userinfo')
  console.log('    GET  /api/auth/govbr/flow-user-info')
  console.log('    POST /api/auth/govbr/logout')
  console.log('  Flows:')
  console.log('    GET  /api/flows')
  console.log('    GET  /api/flows/:flowId')
  console.log('  Licenciamento:')
  console.log('    GET  /api/licenciamento/veiculos')
  console.log('    POST /api/licenciamento/veiculos/:renavam/verificar')
  console.log('    POST /api/licenciamento/veiculos/:renavam/qr-code')
  console.log('    GET  /api/licenciamento/veiculos/:renavam/qr-code')
  console.log('    GET  /api/licenciamento/veiculos/:renavam/crlv-e')
  console.log('  Dashboard:')
  console.log('    GET  /api/dashboard/meus-veiculos')
  console.log('    GET  /api/dashboard/pontuacao-cnh')
  console.log('    GET  /api/dashboard/dados-condutor')
  console.log('    GET  /api/dashboard/debitos-pendentes')
  console.log('    GET  /api/dashboard/detalhes-pontuacao-cnh')
  console.log('    GET  /api/dashboard/lista-multas')
  console.log('    GET  /api/dashboard/multas')
  console.log('  Notificações:')
  console.log('    POST /api/notificacoes/dispositivos')
  console.log('    PUT  /api/notificacoes/dispositivos/tags')
  console.log('    GET  /api/notificacoes/badge')
  console.log('    GET  /api/notificacoes/mensagens')
  console.log('    GET  /api/notificacoes/mensagens/:id')
  console.log('  Services:')
  console.log('    GET  /api/services/get-vehicles')
  console.log('    POST /api/services/solicitar-vistoria-em-transito')
  console.log('  TDV:')
  console.log('    GET  /api/tdv/veiculos')
  console.log('    POST /api/tdv/analise-requisitos')
  console.log('    POST /api/tdv/validacao-comprador')
  console.log('    POST /api/tdv/validacao-venda')
  console.log('    POST /api/tdv/criar')
  console.log('    POST /api/tdv/informar-dados-venda')
  console.log('    POST /api/tdv/confirmar-intencao-venda')
  console.log('    POST /api/tdv/confirmar-termo-ciencia')
  console.log('    POST /api/tdv/cancelar')
  console.log('    GET  /api/tdv/compras')
  console.log('    POST /api/tdv/confirmar-compra')
  console.log('    POST /api/tdv/criar-compra')
  console.log('    POST /api/tdv/validar-tdv')
  console.log('    GET  /api/tdv/link-assinatura-iti')
  console.log('    POST /api/tdv/valida-assinatura')
  console.log('    POST /api/tdv/prova-vida')
  console.log('    GET  /api/tdv/consulta-debitos')
  console.log('    GET  /api/tdv/enderecos/:cep')
  console.log('')
})
