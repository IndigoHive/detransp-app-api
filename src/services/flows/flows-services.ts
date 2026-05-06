import { asClass, NameAndRegistrationPair } from 'awilix'
import { ListFlowsService } from './list-flows-service'
import { GetPublishedFlowVersionByFlowIdService } from './get-published-flow-version-by-flow-id-service'
import { GetPublishedFlowJsonByFlowIdService } from './get-published-flow-json-by-flow-id-service'

export type FlowServices = {
  listFlowsService: ListFlowsService
  getPublishedFlowVersionByFlowIdService: GetPublishedFlowVersionByFlowIdService
  getPublishedFlowJsonByFlowIdService: GetPublishedFlowJsonByFlowIdService
}

export function getFlowsRegistrations (): Required<NameAndRegistrationPair<FlowServices>> {
  return {
    listFlowsService: asClass(ListFlowsService).scoped(),
    getPublishedFlowVersionByFlowIdService: asClass(GetPublishedFlowVersionByFlowIdService).scoped(),
    getPublishedFlowJsonByFlowIdService: asClass(GetPublishedFlowJsonByFlowIdService).scoped(),
  }
}
