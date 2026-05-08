export type ListFlowsResultData = {
  id: string
  slug: string
  name: string
  description: string | null
  iconName: string | null
}

export type ListFlowsResult = {
  data: ListFlowsResultData[]
}
