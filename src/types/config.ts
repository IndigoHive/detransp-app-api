export type ApplicationEnvironment =
  'development' |
  'production' |
  'test'

export type Config = {
  application: {
    environment: ApplicationEnvironment
    port: number
  }
  database: {
    connectionString: string
  }
  logging: {
    level: string
  }
}
