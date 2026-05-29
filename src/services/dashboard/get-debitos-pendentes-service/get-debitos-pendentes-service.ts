import type { DetranSpServiceNowDashboardClient } from '../../../clients'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'

export class GetDebitosPendentesService {
  constructor(private dashboardClient: DetranSpServiceNowDashboardClient) {}

  async run(authorizationHeader: string | undefined, veicnum = '5'): Promise<unknown> {
    const token = extractBearerToken(authorizationHeader)
    const cpf = extractCpfFromToken(token)
    return this.dashboardClient.get('debitosPendentes', token, cpf, { cpf, veicnum })
  }
}
