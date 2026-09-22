import {
  asFunction,
  type AwilixContainer,
  createContainer as createAwilixContainer,
  asClass,
  asValue,
  NameAndRegistrationPair
} from 'awilix'
import { config as defaultConfig } from '../config'
import { Config } from '../../types'
import { Pool } from 'pg'
import { PostHog } from 'posthog-node'
import { RepositoryServices } from '../types/repository-services'
import { ContainerServices } from '../types/container-services'
import { Database } from '../../db/pool'
import { PgFlowRepository } from '../../repositories/pg-flow-repository'
import { PgSessionRepository } from '../../repositories/pg-session-repository'
import { getAnalyticsRegistrations, getAttestationRegistrations, getAuthRegistrations, getFlowsRegistrations, getProtocolsRegistrations, getDashboardRegistrations, getLicenciamentoRegistrations, getDebRestrRegistrations, getTdvRegistrations, getPecasRegistrations, getVistoriasRegistrations } from '../../services'
import { getClientRegistrations, DetranSpServiceNowLicenciamentoClient, DetranSpServiceNowVistoriasClient } from '../../clients'
import { DetranSpServiceNowAttestationClient } from '../../clients/detran-sp-service-now-attestation'
import { DetranSpServiceNowDebRestrClient } from '../../clients/detran-sp-service-now-deb-restr'
import { DetranSpServiceNowPgtoClient } from '../../clients/detran-sp-service-now-pgto'
import { RotaCaixaPostalClient } from '../../clients/rota-caixa-postal'
import { RotaVidaClient, MockRotaVidaClient } from '../../clients/rota-vida'
import { MockDetranSpServiceNowTdvClient, tdvMockStore, estadoLabel } from '../../clients/detran-sp-service-now/tdv/mock'
import { RotaCrvPecasClient } from '../../clients/rota-crv-pecas'
import { RotaVistoriasClient } from '../../clients/rota-vistorias'
import pino, { type Logger } from 'pino'
export type CreateContainerOptions = {
  config?: Config
}

export function createContainer (
  options: CreateContainerOptions = {}
): AwilixContainer<ContainerServices> {
  const { config = defaultConfig } = options

  const container = createAwilixContainer<ContainerServices>()

  container.register({
    config: asValue(config),
    detranSpServiceNowLicenciamentoClient: asClass(DetranSpServiceNowLicenciamentoClient).scoped(),
    detranSpServiceNowVistoriasClient: asClass(DetranSpServiceNowVistoriasClient).scoped(),
    detranSpServiceNowDebRestrClient: asClass(DetranSpServiceNowDebRestrClient).scoped(),
    detranSpServiceNowPgtoClient: asClass(DetranSpServiceNowPgtoClient).scoped(),
    detranSpServiceNowAttestationClient: asClass(DetranSpServiceNowAttestationClient).scoped(),
    rotaCaixaPostalClient: asFunction(({ config: cfg, logger }: { config: Config; logger: Logger }) =>
      new RotaCaixaPostalClient({
        baseUrl: cfg.rotaCaixaPostal.baseUrl,
        appTopic: cfg.rotaCaixaPostal.appTopic,
        logger,
      })
    ).scoped(),
    rotaVidaClient: asFunction(({ config: cfg, logger }: { config: Config; logger: Logger }) =>
      new RotaVidaClient({
        vidaBaseUrl: cfg.rotaVida.vidaBaseUrl,
        arquivosBaseUrl: cfg.rotaVida.arquivosBaseUrl,
        logger,
      })
    ).scoped(),
    rotaCrvPecasClient: asFunction(({ config: cfg, logger }: { config: Config; logger: Logger }) =>
      new RotaCrvPecasClient({
        baseUrl: cfg.rotaCrvPecas.baseUrl,
        arquivosBaseUrl: cfg.rotaCrvPecas.arquivosBaseUrl,
        logger,
      })
    ).scoped(),
    rotaVistoriasClient: asFunction(({ config: cfg, logger }: { config: Config; logger: Logger }) =>
      new RotaVistoriasClient({ baseUrl: cfg.rotaVistorias.baseUrl, logger })
    ).scoped(),
    // LOG_LEVEL was previously never wired here — pino defaulted to 'info'
    // regardless of config, so every .debug() call in the codebase (e.g. the
    // ServiceNow request interceptors) was silently dropped everywhere.
    logger: asFunction(({ config: cfg }: { config: Config }) =>
      pino({
        level: cfg.logging.level,
        serializers: { err: pino.stdSerializers.err },
        redact: {
          paths: [
            'headers.authorization',
            'headers.Authorization',
            'headers["sn-token"]',
            'headers["SN-Token"]',
            'headers.cookie',
            'headers.Cookie',
            'headers["set-cookie"]',
            'headers["x-cpf-usuario"]',
            'headers["X-CPF-Usuario"]',
            'req.headers.authorization',
            'req.headers.cookie',
            'request.headers.authorization',
            'request.headers.cookie',
            'config.headers.authorization',
            'config.headers.Authorization',
            'config.headers["sn-token"]',
            'config.headers["SN-Token"]',
            'config.headers.cookie',
            'config.headers.Cookie',
            'config.headers["x-cpf-usuario"]',
            'config.headers["X-CPF-Usuario"]'
          ],
          censor: '[REDACTED]'
        }
      })
    ).singleton(),
    posthog: asFunction(({ config: cfg, logger }: { config: Config; logger: Logger }) => {
      const posthog = new PostHog(cfg.posthog.apiKey, {
        flushAt: 10,
        flushInterval: 3_000,
        host: cfg.posthog.host
      })

      // Analytics nunca pode derrubar um request: falha de entrega vira log, não exceção.
      posthog.on('error', (error) => logger.error({ error }, 'PostHog event delivery failed'))

      return posthog
    }).singleton(),
  })
  container.register(getClientRegistrations())
  container.register(getAttestationRegistrations())
  container.register(getAnalyticsRegistrations())
  container.register(getFlowsRegistrations())
  container.register(getAuthRegistrations())
  container.register(getProtocolsRegistrations())
  container.register(getDashboardRegistrations())
  container.register(getLicenciamentoRegistrations())
  container.register(getDebRestrRegistrations())
  container.register(getTdvRegistrations())
  container.register(getPecasRegistrations())
  container.register(getVistoriasRegistrations())
  container.register(getPool(config))
  container.register(getRepositoryRegistrations())

  // Dev/QA-only: swap the ServiceNow TDV client (and prova-vida client) for in-memory stateful
  // mocks so the whole seller/buyer TDV flow can be run without external dependencies. Registered
  // last so it overrides the real registrations above (Awilix: last write wins per key).
  if (config.tdvMock.enabled) {
    container.register({
      detranSpServiceNowTdv: asClass(MockDetranSpServiceNowTdvClient).scoped(),
      rotaVidaClient: asFunction(({ config: cfg, logger }: { config: Config; logger: Logger }) =>
        new MockRotaVidaClient({
          vidaBaseUrl: cfg.rotaVida.vidaBaseUrl,
          arquivosBaseUrl: cfg.rotaVida.arquivosBaseUrl,
          logger,
        })
      ).scoped(),
    })
    console.log(
      `⚠️  TDV MOCK MODE ATIVO — TDV ${config.tdvMock.versao} rodando em memória (in-memory, stateful). Nunca use em produção.`
    )

    const seeded = tdvMockStore.ensureSeeded(config.tdvMock)
    if (seeded) {
      console.log(
        `⚠️  TDV MOCK: massa da TDV ${seeded.versao} ` +
        `(vendedor ${config.tdvMock.sellerCpf}, comprador ${config.tdvMock.buyerCpf})`
      )
      for (const record of seeded.records) {
        const identidade = record.codigoTransferenciaVeiculo
          ? `${record.numeroTransferenciaVeiculo} · ${estadoLabel(record.estado)}`
          : 'comunicação de venda (sem TDV ainda)'
        console.log(`   • ${record.placaVeiculo}  origem ${record.origem}  →  ${identidade}`)
      }
    } else {
      console.log(
        `⚠️  TDV MOCK: massa da TDV ${config.tdvMock.versao} inicia vazia — o fluxo cria a TDV do zero.`
      )
    }

    if (config.tdvMock.pendencia) {
      console.log(`⚠️  TDV MOCK: criaTdv vai falhar com a pendência "${config.tdvMock.pendencia}".`)
    }
    if (config.tdvMock.validarTdv) {
      console.log(`⚠️  TDV MOCK: validar-tdv vai falhar com "${config.tdvMock.validarTdv}".`)
    }
  }

  return container
}


function getPool (config: Config): Required<NameAndRegistrationPair<Pick<ContainerServices, 'pool'>>> {
  return {
    pool: asFunction(() => {
      const pool = new Pool({
        connectionString: config.database.connectionString
      })

      pool.on('error', (err) => {
        console.error('Unexpected error on idle client', err)
      })

      return pool
    })
      .singleton()
      .disposer(pool => pool.end())
  }
}

export function getRepositoryRegistrations (): Required<NameAndRegistrationPair<RepositoryServices>> {
  return {
    database: asFunction(({ pool }) => new Database({ pg: pool })).scoped(),
    flowRepository: asClass(PgFlowRepository).scoped(),
    sessionRepository: asClass(PgSessionRepository).scoped(),
  }
}
