import { IFlowRepository } from '../../../repositories/types/flow-repository'

export type GetPublishedFlowVersionByFlowIdResult = {
  id: string
  versionNumber?: number
  flowJson: unknown
}

export class GetPublishedFlowVersionByFlowIdService {
  private readonly flowRepository: IFlowRepository

  constructor (options: {
    flowRepository: IFlowRepository
  }) {
    this.flowRepository = options.flowRepository
  }

  async run (flowId: string): Promise<GetPublishedFlowVersionByFlowIdResult | null> {
    const publishedFlowJson = await this.flowRepository.getPublishedFlowVersionByFlowId(flowId)

    if (!publishedFlowJson) {
      return null
    }

    return {
      id: publishedFlowJson.flowVersionId,
      flowJson: publishedFlowJson.flowJson
    }
  }
}
