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
    assunto: 'Licenciamento próximo do vencimento',
    corpo: 'O licenciamento do veículo placa ABC1D23 vence em 30 dias. Regularize para evitar multas.',
    data: '2026-06-20T14:30:00',
    lida: false,
  },
  {
    id: 'notif-2',
    assunto: 'IPVA 2026 disponível para pagamento',
    corpo: 'O IPVA 2026 do veículo placa XYZ9E87 já está disponível para pagamento. Aproveite o desconto à vista.',
    data: '2026-06-18T09:15:00',
    lida: false,
  },
  {
    id: 'notif-3',
    assunto: 'Multa registrada',
    corpo: 'Foi registrada uma nova multa no veículo placa ABC1D23. Auto de infração: SP00012345. Acesse o app para mais detalhes.',
    data: '2026-06-10T11:00:00',
    lida: true,
  },
  {
    id: 'notif-4',
    assunto: 'Bem-vindo ao DETRAN-SP Digital',
    corpo: 'Seja bem-vindo ao aplicativo oficial do DETRAN-SP. Aqui você pode consultar veículos, pagar débitos, e acessar diversos serviços.',
    data: '2026-06-01T08:00:00',
    lida: true,
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
const FLOW_ID_TDV = '7e1761e2-bace-4c2f-b1eb-a4bf6459d9d4'

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

app.get('/api/auth/govbr/userinfo', (_req, res) => {
  res.json({
    data: {
      sub: '12345678900',
      name: 'João da Silva Santos',
      email: 'joao.silva@email.com',
      phone_number: '+5511999998888',
      cpf: '123.456.789-00',
      picture: null,
    },
  })
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

app.get('/api/notificacoes/mensagens', (_req, res) => {
  res.json(MOCK_NOTIFICATIONS)
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
app.get('/api/tdv/verificar-estado', (_req, res) => {
  res.json({
    proximaAcao: 'nova_tdv',
  })
})

app.get('/api/tdv/veiculos', (_req, res) => {
  res.json({
    vehicles: MOCK_VEHICLES.map(v => ({
      id: v.id,
      title: v.title,
      plate: v.plate,
      licensingStatus: v.licensingStatus,
      licensingExpirationDate: v.licensingExpirationDate,
      type: v.type,
      brandModel: v.brandModel,
      renavam: v.renavam,
      lastLicensing: v.lastLicensing,
      yearFab: v.yearFab,
      yearMod: v.yearMod,
    })),
  })
})

app.post('/api/tdv/analise-requisitos', (req, res) => {
  res.json({
    hasRestriction: false,
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
  res.status(201).json({
    codigo: 'TDV-' + Date.now().toString(36).toUpperCase(),
  })
})

app.post('/api/tdv/cancelar', (req, res) => {
  res.json({
    success: true,
    message: 'Transferência cancelada com sucesso.',
  })
})

app.get('/api/tdv/compras', (_req, res) => {
  res.json({
    vehicles: [
      {
        id: '10',
        title: 'FIAT/ARGO 1.0',
        plate: 'DEF5G67',
        licensingStatus: 'REGULAR',
        licensingExpirationDate: '31/12/2025',
        type: 'Passeio',
        brandModel: 'FIAT/ARGO 1.0',
        renavam: '00010020030',
        lastLicensing: '10/05/2025',
        yearFab: '2021',
        yearMod: '2022',
        codigoTransferencia: 'TDV-MOCK001',
        origem: '1',
      },
      {
        id: 'GHI8J90-00010020031',
        title: 'VW/GOL 1.0',
        plate: 'GHI8J90',
        licensingStatus: 'REGULAR',
        licensingExpirationDate: '31/12/2025',
        type: 'Passeio',
        brandModel: 'VW/GOL 1.0',
        renavam: '00010020031',
        lastLicensing: '10/05/2025',
        yearFab: '2019',
        yearMod: '2020',
        codigoTransferencia: '',
        ativa: 'true',
        origem: '2',
        origemComunicacaoVendaVeiculo: '9',
        descricaoMarcaVeiculo: 'VW/GOL 1.0',
        nomeVendedor: 'João Vendedor',
        codigoVendedor: '11122233344',
        nomeMunicipioVeiculo: 'SAO PAULO',
      },
    ],
  })
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
    } : null,
  })
})

app.post('/api/tdv/confirmar-endereco', (req, res) => {
  res.json({
    proximaAcao: 'aviso_pagamento',
    estado: '7',
  })
})

app.post('/api/tdv/criar-compra', (req, res) => {
  res.json({
    proximaAcao: 'aviso_pagamento',
    estado: '7',
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

app.get('/api/tdv/consulta-debitos', (req, res) => {
  const codigoTransferencia = (req.query.codigoTransferencia as string) || 'TDV-MOCK'
  res.json({
    nomeComprador: 'Maria Oliveira Souza',
    taxaTransferencia: 'R$ 243,77',
    taxaLicenciamento: 'R$ 120,50',
    totalDebitos: 'R$ 364,27',
    qrCode: `00020126580014br.gov.bcb.pix0136mock-tdv-pix-${codigoTransferencia}520400005303986540364.275802BR5925DETRAN SP6009SAO PAULO`,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
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
  console.log('    GET  /api/tdv/verificar-estado')
  console.log('    GET  /api/tdv/veiculos')
  console.log('    POST /api/tdv/analise-requisitos')
  console.log('    POST /api/tdv/validacao-comprador')
  console.log('    POST /api/tdv/validacao-venda')
  console.log('    POST /api/tdv/criar')
  console.log('    POST /api/tdv/cancelar')
  console.log('    GET  /api/tdv/compras')
  console.log('    POST /api/tdv/confirmar-compra')
  console.log('    POST /api/tdv/confirmar-endereco')
  console.log('    POST /api/tdv/criar-compra')
  console.log('    POST /api/tdv/valida-assinatura')
  console.log('    POST /api/tdv/prova-vida')
  console.log('    GET  /api/tdv/consulta-debitos')
  console.log('')
})
