import * as Sentry from '@sentry/node'
import { config } from './container/config'

const enabled = Boolean(config.sentry.dsn) && config.application.environment !== 'test'

Sentry.init({
  dsn: config.sentry.dsn,
  enabled,
  debug: config.application.environment !== 'production',
  environment: config.application.environment,
  dataCollection: {
    userInfo: false,
    httpBodies: []
  }
})
