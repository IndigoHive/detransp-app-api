import * as Sentry from '@sentry/node'
import { config } from './container/config'

Sentry.init({
  dsn: config.sentry.dsn,
  enabled: config.application.environment !== 'production',
  debug: true,
  environment: config.application.environment,
  dataCollection: {
    userInfo: false,
    httpBodies: []
  }
})
