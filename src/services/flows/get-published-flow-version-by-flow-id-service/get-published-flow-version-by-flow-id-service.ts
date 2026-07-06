import { IFlowRepository } from '../../../repositories/types/flow-repository'

export type GetPublishedFlowVersionByFlowIdResult = {
  data: {
    flowVersionId: string
    flowJson: unknown
  } | null
}

// Absolute URLs stored in the database point to the production API. Stripping
// the prefix turns them into relative paths so the flow engine resolves them
// against EXPO_PUBLIC_API_BASE_URL in the app — which works in every
// environment (mock, dev, staging, production) without any extra config.
const ABSOLUTE_API_URL_PREFIXES = [
  'https://detransp-app-api-1990fe11bc9a.herokuapp.com/',
]

function rewriteFlowJsonUrls (flowJson: unknown): unknown {
  if (flowJson == null) return flowJson
  let serialized = JSON.stringify(flowJson)
  for (const prefix of ABSOLUTE_API_URL_PREFIXES) {
    serialized = serialized.split(prefix).join('')
  }
  return JSON.parse(serialized)
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

    if (!publishedFlowJson) {
      return { data: null }
    }

    return {
      data: {
        ...publishedFlowJson,
        flowJson: rewriteFlowJsonUrls(publishedFlowJson.flowJson),
      }
    }
  }
}
