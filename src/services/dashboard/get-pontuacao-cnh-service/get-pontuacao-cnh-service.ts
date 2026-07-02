import type { DetranSpServiceNowDashboardClient } from '../../../clients'

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

  async run(accessToken: string, cpf: string) {
    const raw = await this.dashboardClient.get<ServiceNowPontuacaoCnhResponse>('pontuacaoCnh', accessToken, cpf)
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
