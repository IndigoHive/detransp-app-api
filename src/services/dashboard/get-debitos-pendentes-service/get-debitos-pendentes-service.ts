import type { DetranSpServiceNowDashboardClient } from '../../../clients'

export class GetDebitosPendentesService {
  constructor(private dashboardClient: DetranSpServiceNowDashboardClient) {}

  async run(accessToken: string, cpf: string, veicnum = '5'): Promise<unknown> {
    return this.dashboardClient.get('debitosPendentes', accessToken, cpf, { cpf, veicnum })
  }
}
