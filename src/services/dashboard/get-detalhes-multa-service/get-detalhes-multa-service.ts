import type { DetranSpServiceNowDashboardClient } from '../../../clients'

export class GetDetalhesMultaService {
  constructor(private dashboardClient: DetranSpServiceNowDashboardClient) {}

  async run(accessToken: string, cpf: string, auto: string, idVeiculo: string): Promise<unknown> {
    return this.dashboardClient.get('multas', accessToken, cpf, { auto, cpf, idVeiculo })
  }
}
