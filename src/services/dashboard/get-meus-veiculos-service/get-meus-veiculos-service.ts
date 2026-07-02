import type { DetranSpServiceNowDashboardClient } from '../../../clients'

export class GetMeusVeiculosService {
  constructor(private dashboardClient: DetranSpServiceNowDashboardClient) {}

  async run(accessToken: string, cpf: string): Promise<unknown> {
    return this.dashboardClient.get('meusVeiculos', accessToken, cpf)
  }
}
