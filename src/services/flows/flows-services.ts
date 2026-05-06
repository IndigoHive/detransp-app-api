import { asClass, NameAndRegistrationPair } from 'awilix'
import { ListFlowsService } from './list-flows-service'
import { GetPublishedFlowVersionByFlowIdService } from './get-published-flow-version-by-flow-id-service'

export type FlowServices = {
  listFlowsService: ListFlowsService
  getPublishedFlowVersionByFlowIdService: GetPublishedFlowVersionByFlowIdService
}

export function getFlowsRegistrations (): Required<NameAndRegistrationPair<FlowServices>> {
  return {
    listFlowsService: asClass(ListFlowsService).scoped(),
    getPublishedFlowVersionByFlowIdService: asClass(GetPublishedFlowVersionByFlowIdService).scoped(),
  }
}
