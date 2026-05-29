export type ApplicationEnvironment =
  'development' |
  'production' |
  'test'

export type Config = {
  application: {
    environment: ApplicationEnvironment
    port: number
  }
  idsp: {
    clientId: string
    clientSecret?: string
    authorizeUrl: string
    tokenUrl: string
    userInfoUrl: string
    redirectUri: string
    scope: string
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
    tdv: {
      baseUrl: string
      username: string
      password: string
    }
  }
  logging: {
    level: string
  }
}
