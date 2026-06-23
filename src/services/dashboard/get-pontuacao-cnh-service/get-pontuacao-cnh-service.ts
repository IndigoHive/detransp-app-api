import type { DetranSpServiceNowDashboardClient } from '../../../clients'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'

type ServiceNowPontuacaoCnhResponse = {
  data: {
    attributes: {
      status: string
    }
  }
  meta: {
    totalPontuacao: string
  }
}

export class GetPontuacaoCnhService {
  constructor(private dashboardClient: DetranSpServiceNowDashboardClient) {}

  async run(authorizationHeader: string | undefined) {
    const token = extractBearerToken(authorizationHeader)
    const cpf = extractCpfFromToken(token)
    const raw = await this.dashboardClient.get<ServiceNowPontuacaoCnhResponse>('pontuacaoCnh', token, cpf)
    return {
      data: {
        attributes: {
          totalPontos: raw.meta.totalPontuacao,
          situacao: raw.data.attributes.status === 'ativa' ? 'ATIVO' : 'INATIVO',
        },
      },
    }
  }
}
