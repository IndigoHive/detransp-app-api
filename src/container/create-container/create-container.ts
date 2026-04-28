import {
  asFunction,
  type AwilixContainer,
  createContainer as createAwilixContainer,
  asClass,
  NameAndRegistrationPair
} from 'awilix'
import { config as defaultConfig } from '../config'
import { Config } from '../../types'
import { Pool } from 'pg'
import { RepositoryServices } from '../types/repository-services'
import { ContainerServices } from '../types/container-services'
import { Database } from '../../db/pool'
import { PgFlowRepository } from '../../repositories/pg-flow-repository'
import { getFlowsRegistrations } from '../../services'
import pino from 'pino'

export type CreateContainerOptions = {
  config?: Config
}

export function createContainer (
  options: CreateContainerOptions = {}
): AwilixContainer<ContainerServices> {
  const { config = defaultConfig } = options

  const container = createAwilixContainer<ContainerServices>()

  container.register(getFlowsRegistrations())
  container.register(getPool(config))
  container.register(getRepositoryRegistrations())
  container.register({
    logger: asFunction(() => pino()).singleton(),
  })


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
