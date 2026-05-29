import type { DetranSpServiceNowDashboardClient } from '../../../clients'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'

export class GetListaMultasService {
  constructor(private dashboardClient: DetranSpServiceNowDashboardClient) {}

  async run(authorizationHeader: string | undefined): Promise<unknown> {
    const token = extractBearerToken(authorizationHeader)
    const cpf = extractCpfFromToken(token)
    return this.dashboardClient.get('listaMultas', token, cpf, { cpf, ultimosmeses: true })
  }
}
