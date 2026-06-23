import type { DetranSpServiceNowDashboardClient } from '../../../clients'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'

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

  async run(authorizationHeader: string | undefined) {
    const token = extractBearerToken(authorizationHeader)
    const cpf = extractCpfFromToken(token)
    const raw = await this.dashboardClient.get<ServiceNowListaMultasResponse>('listaMultas', token, cpf, { cpf, ultimosmeses: true })
    const multas = (raw.included ?? []).map((item) => ({
      auto: item.id,
      placa: item.attributes.placa,
      descricao: item.attributes.infracao,
      pontos: parseInt(item.attributes.pontuacaoAtribuida, 10) || 0,
    }))
    return { multas }
  }
}
