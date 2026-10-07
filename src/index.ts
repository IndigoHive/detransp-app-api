import './instrument'
import * as Sentry from '@sentry/node'
import { createApp } from './app'
import { createContainer } from './container'
import { config } from './container/config'

async function main () {
  const container = createContainer()

  const logger = container.resolve('logger')

  const app = createApp({ container })

  app.listen(config.application.port, error => {
    if (error) {
      logger.error(error, 'Failed to start App API')
      process.exit(1)
    } else {
      logger.info('App API is running on http://localhost:%s', config.application.port)
    }
  })
  
  // SIGTERM é o sinal que o Kubernetes manda ao encerrar um pod (SIGINT é só
  // Ctrl+C local) — sem tratá-lo, o rolling update com maxUnavailable: 0 (fase 8.3
  // do guia de implantação) não drena nada antes do processo morrer.
  const shutdown = (signal: string) => {
    logger.info('Shutting down App API (%s)...', signal)

    Sentry.close(2000)
      .then(() => container.dispose())
      .then(() => {
        logger.info('Container disposed')
      })
      .catch(error => {
        logger.error(error, 'Error while disposing container')
      })
      .finally(() => {
        process.exit(0)
      })
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

void main()
