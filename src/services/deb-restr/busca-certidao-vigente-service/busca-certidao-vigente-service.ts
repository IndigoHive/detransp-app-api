import type { DetranSpServiceNowDebRestrClient } from '../../../clients/detran-sp-service-now-deb-restr'
import { DetranSpServiceNowDebRestrError } from '../../../clients/detran-sp-service-now-deb-restr'
import type { CertidaoVigenteResult, DebRestrVeiculoAuth } from '../types'
import { formatDateBr } from '../utils'

const CERTIDAO_DESCRICAO = 'Certidão de débitos e restrições do veículo'

// ServiceNow keeps at most ONE current certidão per vehicle (re-viewable free
// for 90 days) — this is a single resource, never a list.
export class BuscaCertidaoVigenteService {
  private readonly client: DetranSpServiceNowDebRestrClient

  constructor (client: DetranSpServiceNowDebRestrClient) {
    this.client = client
  }

  async run (auth: DebRestrVeiculoAuth): Promise<CertidaoVigenteResult> {
    const veiculo = await this.client.buscaVeiculo(auth, auth.renavam)
    const certidaoLink = veiculo?.data?.relationships?.certidao?.links?.self
    if (!certidaoLink) {
      return { disponivel: false, emissao: null, descricao: null }
    }

    try {
      const certidao = await this.client.buscaCertidao(auth, auth.renavam)
      if (!certidao?.data) {
        return { disponivel: false, emissao: null, descricao: null }
      }

      const dataHoraEmissao = certidao.data.attributes?.dataHoraEmissao
      return {
        disponivel: true,
        emissao: dataHoraEmissao ? formatDateBr(dataHoraEmissao.slice(0, 10)) : null,
        descricao: CERTIDAO_DESCRICAO,
      }
    } catch (err) {
      // The link says a certidão exists; if fetching its details fails with a
      // known ServiceNow error, degrade to "não disponível" instead of breaking the flow
      if (err instanceof DetranSpServiceNowDebRestrError) {
        return { disponivel: false, emissao: null, descricao: null }
      }
      throw err
    }
  }
}
