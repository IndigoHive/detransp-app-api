export type ApplicationEnvironment =
  'development' |
  'staging' |
  'production' |
  'test'

export type Platform = 'android' | 'ios'

export const TDV_MOCK_VERSOES = ['1.0', '2.0', '3.0', '4.0', '6.0'] as const
export type TdvMockVersao = typeof TDV_MOCK_VERSOES[number]

export const TDV_MOCK_PENDENCIAS = [
  'pagamento_pendente',
  'vistoria_pendente',
  'vistoria_pagamento_pendentes',
  'administrativa_pendente',
  'judicial_pendente',
  'administrativa_judicial_pendentes'
] as const
export type TdvMockPendencia = typeof TDV_MOCK_PENDENCIAS[number] | ''

export const TDV_MOCK_VALIDAR_TDV = ['duas_assinaturas', 'duas_pessoas_fisicas'] as const
export type TdvMockValidarTdv = typeof TDV_MOCK_VALIDAR_TDV[number] | ''

export type IdspPlatformConfig = {
  clientId: string
  clientSecret?: string
  redirectUri: string
}

export type Config = {
  application: {
    environment: ApplicationEnvironment
    port: number
  }
  idsp: {
    authorizeUrl: string
    tokenUrl: string
    userInfoUrl: string
    scope: string
    android: IdspPlatformConfig
    ios: IdspPlatformConfig
  }
  database: {
    connectionString: string
  }
  serviceNow: {
    csm: {
      baseUrl: string
      username: string
      password: string
    }
    api: {
      baseUrl: string,
      dashboardUrl: string
    }
  }
  rotaCaixaPostal: {
    baseUrl: string
    appTopic: string
  }
  security: {
    encryptionKey: string
    // Pepper só de servidor usado para derivar o distinct_id pseudônimo do analytics
    // a partir do CPF. Nunca sai do backend; trocá-lo desassocia o histórico no PostHog.
    pseudonymousIdPepper: string
  }
  rotaVida: {
    vidaBaseUrl: string
    arquivosBaseUrl: string
    bypassMatch: boolean
  }
  // Dev/QA-only: when enabled, the TDV service runs against an in-memory stateful mock
  // (see MockDetranSpServiceNowTdvClient) instead of the real ServiceNow backend, so the
  // whole seller/buyer flow can be exercised without external dependencies. Never in prod.
  tdvMock: {
    enabled: boolean
    // Which TDV version the seeded mass reproduces: '1.0' (native), '2.0' (e-Notariado + CDT),
    // '3.0' (Renave saída), '4.0' (Entrada Renave) or '6.0' (Cartório/SEFAZ). Each version seeds
    // the records ServiceNow would return for it, with the right origem — see TdvMockStore.
    versao: TdvMockVersao
    sellerCpf: string
    buyerCpf: string
    vehiclePlate: string
    vehicleRenavam: string
    // When set (a raw CodigoEstadoTDV code, "1".."10"), the mock seeds one TDV already at that
    // state — with seller, buyer, and sale data all pre-filled — instead of starting empty, so
    // a single step of the flow can be tested without redoing everything before it.
    // On the buyer-side versions (2.0/3.0/6.0), leaving it empty seeds a raw comunicação de
    // venda — no estado, no codigoTransferenciaVeiculo — which is the state those journeys
    // actually start from.
    initialEstado: string
    // Makes criaTdv fail with the matching ServiceNow pendência error, to exercise the
    // pendência screens of the buyer journeys. Empty = happy path.
    pendencia: TdvMockPendencia
    // Makes validar-tdv fail with the matching TDV 6.0 error. Empty = passes validation.
    validarTdv: TdvMockValidarTdv
    // Dev/QA-only escape hatches to exercise error paths that real mock data can't easily
    // trigger — see AnaliseRequisitosService / ValidacaoVendaService. Never in prod.
    forceVehicleRestriction: boolean
    forceCidadesDiferentes: boolean
  }
  rotaCrvPecas: {
    baseUrl: string
    arquivosBaseUrl: string
  }
  rotaVistorias: {
    baseUrl: string
  }
  iti: {
    baseUrl: string
    clientId: string
    redirectUri: string
  }
  logging: {
    level: string
  }
  posthog: {
    apiKey: string
    host: string
  }
}
