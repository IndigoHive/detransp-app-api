import type { DetranSpServiceNowDashboardClient } from '../../../clients'

type ServiceNowListaMultasResponse = {
  included: {
    type: string
    id: string
    attributes: {
      placa: string
      infracao: string
      pontuacaoAtribuida: string
    }
  }[]
}

export class GetListaMultasService {
  constructor(private dashboardClient: DetranSpServiceNowDashboardClient) {}

  async run(accessToken: string, cpf: string, ultimosMeses = true) {
    const raw = await this.dashboardClient.get<ServiceNowListaMultasResponse>('listaMultas', accessToken, cpf, {
      cpf,
      ultimosmeses: ultimosMeses,
    })
    const multas = (raw.included ?? []).map((item) => ({
      auto: item.id,
      placa: item.attributes.placa,
      descricao: item.attributes.infracao,
      pontos: parseInt(item.attributes.pontuacaoAtribuida, 10) || 0,
    }))
    return { multas }
  }
}
