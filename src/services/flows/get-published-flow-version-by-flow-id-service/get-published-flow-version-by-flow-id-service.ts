import { IFlowRepository } from '../../../repositories/types/flow-repository'

export type GetPublishedFlowVersionByFlowIdResult = {
  data: {
    flowVersionId: string
    flowJson: unknown
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
    const publishedFlowJson = await this.flowRepository.getPublishedFlowVersionByFlowId(flowId)

    return {
      data: publishedFlowJson
    }
  }
}
