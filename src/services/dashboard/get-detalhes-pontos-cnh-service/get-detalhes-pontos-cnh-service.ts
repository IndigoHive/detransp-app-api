import type { DetranSpServiceNowDashboardClient } from '../../../clients'

export class GetDetalhesPontosCnhService {
  constructor(private dashboardClient: DetranSpServiceNowDashboardClient) {}

  async run(accessToken: string, cpf: string, meses = 'true', tipoDoc = 'REGISTRO'): Promise<unknown> {
    return this.dashboardClient.get('detalhesPontuacaoCnh', accessToken, cpf, { meses, tipoDoc })
  }
}
