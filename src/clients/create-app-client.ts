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
  id: string
  name: string
  description: string
  iconName?: string
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
      const response = await http.get<ListFlowsApiResponse[]>('/api/flows')

      return response.data
    },
    async getFlowVersion (flowId: string): Promise<FlowVersionResponse> {
      const response = await http.get<FlowVersionResponse>(`/api/flows/${flowId}`)

      return response.data
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
