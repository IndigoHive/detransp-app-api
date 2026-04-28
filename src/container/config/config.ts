import { ApplicationEnvironment, Config } from '../../types'
import { env } from './env'

const DEFAULT_PORT = 3500
const DEFAULT_LOG_LEVEL = 'info'

export const config: Config = {
  application: {
    environment: (env.NODE_ENV || 'development') as ApplicationEnvironment,
    port: env.PORT ? parseInt(env.PORT) : DEFAULT_PORT,
  },
  database: {
    connectionString: env.DATABASE_URL!
  },
  logging: {
    level: env.LOG_LEVEL || DEFAULT_LOG_LEVEL
  }
}
