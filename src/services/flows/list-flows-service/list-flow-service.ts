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

    const result: ListFlowsResult = {
      data: flows.map(flow => ({
        id: flow.id,
        slug: flow.slug,
        name: flow.name,
        description: flow.description,
        iconName: flow.iconName
      }))
    }

    return result
  }
}
