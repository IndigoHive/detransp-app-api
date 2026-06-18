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
import { getAuthRegistrations, getFlowsRegistrations, getServicesRegistrations, getDashboardRegistrations, getLicenciamentoRegistrations } from '../../services'
import { getClientRegistrations, DetranSpServiceNowLicenciamentoClient, DetranSpServiceNowDebRestrClient } from '../../clients'
import { RotaCaixaPostalClient } from '../../clients/rota-caixa-postal'
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
    detranSpServiceNowDebRestrClient: asClass(DetranSpServiceNowDebRestrClient).scoped(),
    rotaCaixaPostalClient: asFunction(({ config: cfg, logger }: { config: Config; logger: Logger }) =>
      new RotaCaixaPostalClient({
        baseUrl: cfg.rotaCaixaPostal.baseUrl,
        appTopic: cfg.rotaCaixaPostal.appTopic,
        logger,
      })
    ).scoped(),
    logger: asFunction(() => pino()).singleton(),
  })
  container.register(getClientRegistrations())
  container.register(getFlowsRegistrations())
  container.register(getAuthRegistrations())
  container.register(getServicesRegistrations())
  container.register(getDashboardRegistrations())
  container.register(getLicenciamentoRegistrations())
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
  }
}
