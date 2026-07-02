import type { AwilixContainer } from 'awilix'
import express from 'express'
import { authRouter, dashboardRouter, debRestrRouter, flowsRouter, healthRouter, licenciamentoRouter, notificacoesRouter, servicesRouter, tdvRouter } from './routers'
import { ContainerServices, createContainer } from '../container'
import { fallbackErrorHandler, httpErrorHandler, scopePerRequest } from './middlewares'

export type CreateAppOptions = {
  container?: AwilixContainer<ContainerServices>
}

export function createApp (options: CreateAppOptions = {}) {
  const { container = createContainer() } = options

  const app = express()

  app.use(scopePerRequest(container))

  // Middlewares
  app.use(express.json({ limit: '10mb' }))

  // Health check
  app.use('/api/health', healthRouter())

  // Authenticated routes
  app.use('/api/auth', authRouter())
  app.use('/api/dashboard', dashboardRouter())
  app.use('/api/deb-restr', debRestrRouter())
  app.use('/api/flows', flowsRouter())
  app.use('/api/licenciamento', licenciamentoRouter())
  app.use('/api/notificacoes', notificacoesRouter())
  app.use('/api/services', servicesRouter())
  app.use('/api/tdv', tdvRouter())

  // Error handlers
  app.use(httpErrorHandler())
  app.use(fallbackErrorHandler())

  return app
}
