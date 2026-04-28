import { Database } from '../../db/pool'
import { IFlowRepository } from '../../repositories/types/flow-repository'

export type RepositoryServices = {
  database: Database
  flowRepository: IFlowRepository
}
