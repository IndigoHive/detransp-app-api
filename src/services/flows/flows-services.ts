import { asClass, NameAndRegistrationPair } from 'awilix'
import { ListFlowsService } from './list-flows-service'

export type FlowServices = {
  listFlowsService: ListFlowsService
}

export function getFlowsRegistrations (): Required<NameAndRegistrationPair<FlowServices>> {
  return {
    listFlowsService: asClass(ListFlowsService).scoped(),
  }
}
