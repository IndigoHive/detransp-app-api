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
import { RepositoryServices } from '../types/repository-services'
import { ContainerServices } from '../types/container-services'
import { Database } from '../../db/pool'
import { PgFlowRepository } from '../../repositories/pg-flow-repository'
import { PgSessionRepository } from '../../repositories/pg-session-repository'
import { getAuthRegistrations, getFlowsRegistrations, getProtocolsRegistrations, getDashboardRegistrations, getLicenciamentoRegistrations, getDebRestrRegistrations, getTdvRegistrations, getPecasRegistrations, getVistoriasRegistrations } from '../../services'
import { getClientRegistrations, DetranSpServiceNowLicenciamentoClient, DetranSpServiceNowVistoriasClient } from '../../clients'
import { DetranSpServiceNowDebRestrClient } from '../../clients/detran-sp-service-now-deb-restr'
import { DetranSpServiceNowPgtoClient } from '../../clients/detran-sp-service-now-pgto'
import { RotaCaixaPostalClient } from '../../clients/rota-caixa-postal'
import { RotaVidaClient } from '../../clients/rota-vida'
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
      pino({ level: cfg.logging.level, serializers: { err: pino.stdSerializers.err } })
    ).singleton(),
  })
  container.register(getClientRegistrations())
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
