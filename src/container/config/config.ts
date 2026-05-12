import { ApplicationEnvironment, Config } from '../../types'
import { env } from './env'

const DEFAULT_PORT = 3500
const DEFAULT_LOG_LEVEL = 'info'
const DEFAULT_GOVBR_SCOPE = 'openid profile email govbr_confiabilidades'
const DEFAULT_GOVBR_AUTHORIZE_URL = 'https://sso.acesso.gov.br/authorize'
const DEFAULT_GOVBR_TOKEN_URL = 'https://sso.acesso.gov.br/token'
const DEFAULT_GOVBR_USERINFO_URL = 'https://sso.acesso.gov.br/userinfo'

export const config: Config = {
  application: {
    environment: (env.NODE_ENV || 'development') as ApplicationEnvironment,
    port: env.PORT ? parseInt(env.PORT) : DEFAULT_PORT,
  },
  idsp: getIdspConfig(),
  database: {
    connectionString: env.DATABASE_URL!
  },
  logging: {
    level: env.LOG_LEVEL || DEFAULT_LOG_LEVEL
  }
}

function getIdspConfig (): Config['idsp'] {
  return {
    clientId: env.GOVBR_IDSP_CLIENT_ID || '',
    ...(env.GOVBR_IDSP_CLIENT_SECRET
      ? { clientSecret: env.GOVBR_IDSP_CLIENT_SECRET }
      : {}),
    authorizeUrl: env.GOVBR_IDSP_AUTHORIZE_URL || DEFAULT_GOVBR_AUTHORIZE_URL,
    tokenUrl: env.GOVBR_IDSP_TOKEN_URL || DEFAULT_GOVBR_TOKEN_URL,
    userInfoUrl: env.GOVBR_IDSP_USERINFO_URL || DEFAULT_GOVBR_USERINFO_URL,
    redirectUri: env.GOVBR_IDSP_REDIRECT_URI || '',
    scope: env.GOVBR_IDSP_SCOPE || DEFAULT_GOVBR_SCOPE,
  }
}
