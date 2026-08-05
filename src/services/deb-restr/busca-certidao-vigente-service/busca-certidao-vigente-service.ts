import type { DetranSpServiceNowDebRestrClient } from '../../../clients/detran-sp-service-now-deb-restr'
import { DetranSpServiceNowDebRestrError } from '../../../clients/detran-sp-service-now-deb-restr'
import type { CertidaoVigenteResult, DebRestrVeiculoAuth } from '../types'
import { formatDateTimeBr } from '../utils'

const CERTIDAO_DESCRICAO = 'Certidão de débitos e restrições do veículo'

export class BuscaCertidaoVigenteService {
  private readonly client: DetranSpServiceNowDebRestrClient

  constructor (client: DetranSpServiceNowDebRestrClient) {
    this.client = client
  }

  async run (auth: DebRestrVeiculoAuth): Promise<CertidaoVigenteResult> {
    try {
      const certidoes = await this.client.listaCertidoes(auth)
      const included = certidoes?.included ?? []

      return included
        .filter((item) => item.attributes?.renavam === auth.renavam)
        .map((item) => ({
          id: item.attributes.sysId_cnm,
          title: CERTIDAO_DESCRICAO,
          description: `Emissão: ${formatDateTimeBr(item.attributes.dataHoraEmissao, true)}`,
        }))
    } catch (err) {
      if (err instanceof DetranSpServiceNowDebRestrError) {
        return []
      }
      throw err
    }
  }
}
