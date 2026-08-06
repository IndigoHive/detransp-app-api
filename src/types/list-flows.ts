export type ListFlowsResultData = {
  id: string
  slug: string
  name: string
  description: string | null
  iconName: string | null
  categories: string[]
}

export type ListFlowsResult = {
  data: ListFlowsResultData[]
}
