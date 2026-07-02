import { Database } from '../../db/pool'
import { IFlowRepository } from '../../repositories/types/flow-repository'
import { ISessionRepository } from '../../repositories/types/session-repository'

export type RepositoryServices = {
  database: Database
  flowRepository: IFlowRepository
  sessionRepository: ISessionRepository
}
