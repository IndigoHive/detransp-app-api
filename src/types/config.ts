export type ApplicationEnvironment =
  'development' |
  'production' |
  'test'

export type Platform = 'android' | 'ios'

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
    sellerCpf: string
    buyerCpf: string
    vehiclePlate: string
    vehicleRenavam: string
    // When set (a raw CodigoEstadoTDV code, "1".."10"), the mock seeds one TDV already at that
    // state — with seller, buyer, and sale data all pre-filled — instead of starting empty, so
    // a single step of the flow can be tested without redoing everything before it.
    initialEstado: string
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
}
