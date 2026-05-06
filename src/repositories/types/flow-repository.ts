export type FlowStatus = 'draft' | 'published' | 'archived'

type Flow = {
  id: string
  slug: string
  name: string
  description: string | null
  status: FlowStatus
  authorId: string
  publishedFlowVersionId: string | null
  createdAt: Date
  updatedAt: Date
}

export type ListFlowResultData = Pick<Flow, 'id' | 'slug' | 'name' | 'description' >

export type GetPublishedFlowVersionByFlowIdResultData = {
  flowId: string
  flowVersionId: string
}

export interface IFlowRepository {
  list (): Promise<ListFlowResultData[]>
  getPublishedFlowVersionByFlowId (flowId: string): Promise<GetPublishedFlowVersionByFlowIdResultData | null>
}
