import * as Sentry from '@sentry/node'
import type { AwilixContainer } from 'awilix'
import express from 'express'
import type { Logger } from 'pino'
import { authRouter, dashboardRouter, debRestrRouter, flowsRouter, healthRouter, licenciamentoRouter, notificacoesRouter, pecasRouter, csmProtocolsRouter, tdvRouter, vistoriasRouter } from './routers'
import { ContainerServices, createContainer } from '../container'
import { fallbackErrorHandler, httpErrorHandler, multerErrorHandler, scopePerRequest, sessionAuth } from './middlewares'

export type CreateAppOptions = {
  container?: AwilixContainer<ContainerServices>
}

export function createApp (options: CreateAppOptions = {}) {
  const { container = createContainer() } = options

  const app = express()

  app.use(scopePerRequest(container))

  // Request logger
  const logger: Logger = container.resolve('logger')
  app.use((req, _res, next) => {
    logger.info({ method: req.method, url: req.url }, 'incoming request')
    next()
  })

  // Middlewares
  app.use(express.json({ limit: '10mb' }))

  // Business-level failures come back as a normal 200 with a `showSnackbar` payload (see
  // src/services/**) instead of throwing, so they never reach setupExpressErrorHandler below.
  // Report them to Sentry here as low-severity events, tagged so they stay segregated from real
  // exceptions and filterable by service/variant.
  app.use((req, res, next) => {
    const originalJson = res.json.bind(res)
    res.json = (body: any) => {
      const snackbar = body?.showSnackbar
      if (snackbar) {
        const service = req.originalUrl.split('?')[0]?.split('/')?.[2] ?? 'unknown'
        // Not a real throw — this stack trace only points at this middleware, not the actual
        // failure site inside the service. The fingerprint override is required: without it,
        // every one of these synthetic errors shares this same stack and Sentry's default
        // exception grouping would collapse them all into a single issue.
        const error = new Error(snackbar.title)
        error.name = 'BusinessSnackbarError'
        Sentry.captureException(error, {
          level: snackbar.variant === 'warning' ? 'warning' : 'error',
          tags: { source: 'business-snackbar', service, variant: snackbar.variant },
          fingerprint: [service, snackbar.title]
        })
      }
      return originalJson(body)
    }
    next()
  })

  // Health check (public)
  app.use('/api/health', healthRouter())

  // Auth routes — public endpoints (authorization-url, token, dev-callback) are handled without
  // session middleware; protected endpoints (userinfo, logout) apply sessionAuth() inline
  app.use('/api/auth', authRouter())

  // All other routes require a valid session
  const protect = sessionAuth()
  app.use('/api/dashboard', protect, dashboardRouter())
  app.use('/api/deb-restr', protect, debRestrRouter())
  app.use('/api/flows', protect, flowsRouter())
  app.use('/api/licenciamento', protect, licenciamentoRouter())
  app.use('/api/notificacoes', protect, notificacoesRouter())
  app.use('/api/pecas', protect, pecasRouter())
  app.use('/api/services', protect, csmProtocolsRouter())
  app.use('/api/tdv', protect, tdvRouter())
  app.use('/api/vistorias', protect, vistoriasRouter())

  // Error handlers — multer primeiro: converte a falha de upload em 400 antes do catch-all.
  Sentry.setupExpressErrorHandler(app)
  app.use(multerErrorHandler())
  app.use(httpErrorHandler())
  app.use(fallbackErrorHandler())

  return app
}
