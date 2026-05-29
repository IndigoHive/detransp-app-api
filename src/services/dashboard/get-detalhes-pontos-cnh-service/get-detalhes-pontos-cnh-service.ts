import type { DetranSpServiceNowDashboardClient } from '../../../clients'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'

export class GetDetalhesPontosCnhService {
  constructor(private dashboardClient: DetranSpServiceNowDashboardClient) {}

  async run(authorizationHeader: string | undefined, meses = 'true', tipoDoc = 'REGISTRO'): Promise<unknown> {
    const token = extractBearerToken(authorizationHeader)
    const cpf = extractCpfFromToken(token)
    return this.dashboardClient.get('detalhesPontuacaoCnh', token, cpf, { meses, tipoDoc })
  }
}
