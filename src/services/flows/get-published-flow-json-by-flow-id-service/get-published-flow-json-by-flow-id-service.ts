import { IFlowRepository } from '../../../repositories/types/flow-repository'

export type GetPublishedFlowJsonByFlowIdResult = {
  data: {
    flowId: string
    flowJson: unknown
  } | null
}

export class GetPublishedFlowJsonByFlowIdService {
  private readonly flowRepository: IFlowRepository

  constructor (options: {
    flowRepository: IFlowRepository
  }) {
    this.flowRepository = options.flowRepository
  }

  async run (flowId: string): Promise<GetPublishedFlowJsonByFlowIdResult> {
    const publishedFlowJson = await this.flowRepository.getPublishedFlowJsonByFlowId(flowId)

    return {
      data: publishedFlowJson
    }
  }
}
