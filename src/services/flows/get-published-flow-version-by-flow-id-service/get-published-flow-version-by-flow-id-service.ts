import { IFlowRepository } from '../../../repositories/types/flow-repository'

export type GetPublishedFlowVersionByFlowIdResult = {
  data: {
    flowId: string
    flowVersionId: string
  } | null
}

export class GetPublishedFlowVersionByFlowIdService {
  private readonly flowRepository: IFlowRepository

  constructor (options: {
    flowRepository: IFlowRepository
  }) {
    this.flowRepository = options.flowRepository
  }

  async run (flowId: string): Promise<GetPublishedFlowVersionByFlowIdResult> {
    const publishedFlowVersion = await this.flowRepository.getPublishedFlowVersionByFlowId(flowId)

    return {
      data: publishedFlowVersion
    }
  }
}
