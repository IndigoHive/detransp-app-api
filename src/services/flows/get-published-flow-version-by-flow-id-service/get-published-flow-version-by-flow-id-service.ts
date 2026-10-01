import type { Selo } from '../../../clients'
import { FlowAudience, IFlowRepository } from '../../../repositories/types/flow-repository'
import type { GetConfiabilidadesService } from '../../auth/get-confiabilidades-service'
import { isSeloAtLeast } from '../../auth/selo-levels'

export type GetPublishedFlowVersionByFlowIdResult =
  | { data: { flowVersionId: string; flowJson: unknown } }
  | { data: null }
  | { data: null; requiresHigherTrustLevel: true; requiredSelo: Selo; currentSelo: Selo | null }

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
  private readonly getConfiabilidadesService: GetConfiabilidadesService

  constructor (options: {
    flowRepository: IFlowRepository
    getConfiabilidadesService: GetConfiabilidadesService
  }) {
    this.flowRepository = options.flowRepository
    this.getConfiabilidadesService = options.getConfiabilidadesService
  }

  async run (
    flowId: string,
    audience: FlowAudience = 'logged',
    accessToken?: string
  ): Promise<GetPublishedFlowVersionByFlowIdResult> {
    const publishedFlowJson = await this.flowRepository.getPublishedFlowVersionByFlowId(flowId, audience)

    if (!publishedFlowJson) {
      return { data: null }
    }

    if (publishedFlowJson.requiredSelo) {
      const highestSelo = accessToken
        ? (await this.getConfiabilidadesService.run({ accessToken })).highestSelo
        : null

      if (!isSeloAtLeast(highestSelo, publishedFlowJson.requiredSelo)) {
        return {
          data: null,
          requiresHigherTrustLevel: true,
          requiredSelo: publishedFlowJson.requiredSelo,
          currentSelo: highestSelo
        }
      }
    }

    return {
      data: {
        flowVersionId: publishedFlowJson.flowVersionId,
        flowJson: rewriteFlowJsonUrls(publishedFlowJson.flowJson),
      }
    }
  }
}
