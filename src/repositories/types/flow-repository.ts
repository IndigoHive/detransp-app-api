import type { Selo } from '../../clients'

export type FlowStatus = 'draft' | 'published' | 'archived'

export type FlowAudience = 'logged' | 'sessionless'

type Flow = {
  id: string
  slug: string
  name: string
  description: string | null
  category: string | null
  status: FlowStatus
  authorId: string
  publishedFlowVersionId: string | null
  iconName: string | null
  createdAt: Date
  updatedAt: Date
}

export type ListFlowResultData = Pick<Flow, 'id' | 'slug' | 'name' | 'description' | 'category' | 'iconName'>

export type GetPublishedFlowVersionByFlowIdResultData = {
  flowVersionId: string
  flowJson: unknown
  requiredSelo: Selo | null
}

export interface IFlowRepository {
  list (audience?: FlowAudience): Promise<ListFlowResultData[]>
  getPublishedFlowVersionByFlowId (flowId: string, audience?: FlowAudience): Promise<GetPublishedFlowVersionByFlowIdResultData | null>
}
