export type ListFlowsResultData = {
  id: string
  slug: string
  name: string
  description: string | null
  categoryId: string | null
  iconName: string | null
}

export type ServiceFilter = {
  id: string
  label: string
  iconName: string
}

export type ListFlowsResult = {
  filters: ServiceFilter[]
  data: ListFlowsResultData[]
}
