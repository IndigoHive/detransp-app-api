import { IFlowRepository } from '../../../repositories/types/flow-repository'
import { ListFlowsResult } from '../../../types/list-flows'


export class ListFlowsService {
  private readonly flowRepository: IFlowRepository

  constructor (options: {
    flowRepository: IFlowRepository
  }) {
    this.flowRepository = options.flowRepository
  }

  async run (): Promise<ListFlowsResult> {
    const flows = await this.flowRepository.list()

    const result: ListFlowsResult = flows.map(flow => ({
        id: flow.id,
        name: flow.name,
        description: flow.description ?? '',
        ...(flow.iconName ? { iconName: flow.iconName } : {})
      }))

    return result
  }
}
