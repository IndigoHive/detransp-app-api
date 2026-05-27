import axios, { type AxiosInstance } from 'axios'

export type FlowSummary = {
  id: string
  name: string
  description: string
  iconName?: string
}

export type FlowVersionResponse = {
  id: string
  versionNumber?: number
  flowJson: unknown
}

export type GovBrUserInfo = {
  data: Record<string, unknown>
}

type ListFlowsApiResponse = {
  data: Array<{
    id: string
    name: string
    description: string | null
    iconName: string | null
  }>
}

type GetFlowVersionApiResponse = {
  data: {
    flowVersionId: string
    flowJson: unknown
  } | null
}

export type AppClient = {
  listFlows: () => Promise<FlowSummary[]>
  getFlowVersion: (flowId: string) => Promise<FlowVersionResponse>
  getGovBrUserInfo: (accessToken: string) => Promise<GovBrUserInfo>
}

export function createAppClient (baseURL: string): AppClient {
  const http: AxiosInstance = axios.create({ baseURL })

  return {
    async listFlows (): Promise<FlowSummary[]> {
      const response = await http.get<ListFlowsApiResponse>('/api/flows')

      return response.data.data.map((flow) => ({
        id: flow.id,
        name: flow.name,
        description: flow.description ?? '',
        ...(flow.iconName ? { iconName: flow.iconName } : {})
      }))
    },
    async getFlowVersion (flowId: string): Promise<FlowVersionResponse> {
      const response = await http.get<GetFlowVersionApiResponse>(`/api/flows/${flowId}`)
      const payload = response.data.data

      if (!payload) {
        throw new Error('Flow version not found')
      }

      return {
        id: payload.flowVersionId,
        flowJson: payload.flowJson
      }
    },
    async getGovBrUserInfo (accessToken: string): Promise<GovBrUserInfo> {
      const response = await http.get<GovBrUserInfo>('/api/auth/govbr/userinfo', {
        headers: {
          authorization: 'Bearer ' + accessToken
        }
      })

      return response.data
    }
  }
}
