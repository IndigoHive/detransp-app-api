import type { AwilixContainer } from 'awilix'
import express from 'express'
import { authRouter, dashboardRouter, debRestrRouter, flowsRouter, healthRouter, licenciamentoRouter, notificacoesRouter, servicesRouter, tdvRouter } from './routers'
import { ContainerServices, createContainer } from '../container'
import { fallbackErrorHandler, httpErrorHandler, scopePerRequest, sessionAuth } from './middlewares'

export type CreateAppOptions = {
  container?: AwilixContainer<ContainerServices>
}

export function createApp (options: CreateAppOptions = {}) {
  const { container = createContainer() } = options

  const app = express()

  app.use(scopePerRequest(container))

  // Middlewares
  app.use(express.json({ limit: '10mb' }))

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
  app.use('/api/services', protect, servicesRouter())
  app.use('/api/tdv', protect, tdvRouter())

  // Error handlers
  app.use(httpErrorHandler())
  app.use(fallbackErrorHandler())

  return app
}
