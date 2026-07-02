import type { DetranSpServiceNowDashboardClient } from '../../../clients'

export class GetDadosCondutorService {
  constructor(private dashboardClient: DetranSpServiceNowDashboardClient) {}

  async run(accessToken: string, cpf: string, payload: string): Promise<unknown> {
    return this.dashboardClient.get('dados-condutor', accessToken, cpf, { payload })
  }
}
