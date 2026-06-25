import type { Logger } from 'pino'
import type { Config } from '../../types'
import {
  DetranSpServiceNowLicenciamentoHttp,
  type DetranSpServiceNowClientAuthWithVeiculo,
} from '../detran-sp-service-now-licenciamento'
import type { ConsultaVeiculoResult } from './types'

export type DetranSpServiceNowDebRestrClientParams = {
  config: Config
  logger: Logger
}

export class DetranSpServiceNowDebRestrClient extends DetranSpServiceNowLicenciamentoHttp {
  constructor(params: DetranSpServiceNowDebRestrClientParams) {
    super({
      baseURL: new URL(
        '/api/x_mdpdd_lic_veic/v1/licenciamento/veiculos',
        params.config.serviceNow.api.baseUrl
      ).toString(),
      logger: params.logger,
    })
  }

  async consultaVeiculo(
    auth: DetranSpServiceNowClientAuthWithVeiculo,
    renavam: string
  ): Promise<ConsultaVeiculoResult> {
    return (
      await this.axios.get(`/${renavam}/placa/${auth.placa.toUpperCase()}`, this.withAuth(auth))
    ).data
  }
}
