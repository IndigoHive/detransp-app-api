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
