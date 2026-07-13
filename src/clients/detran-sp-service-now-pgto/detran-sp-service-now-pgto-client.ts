import type { Logger } from 'pino'
import type { Config } from '../../types'
import {
  type DetranSpServiceNowClientAuth,
  type DetranSpServiceNowClientAuthWithVeiculo,
  DetranSpServiceNowPgtoHttp
} from './detran-sp-service-now-pgto-http'
import type { CriaPixBody, ListaDebitosResult, ListaTiposServicoResult, PixResult } from './types'

const PIX_TIMEOUT_MS = 35000

export type DetranSpServiceNowPgtoClientParams = {
  config: Config
  logger: Logger
}

export class DetranSpServiceNowPgtoClient extends DetranSpServiceNowPgtoHttp {
  constructor (params: DetranSpServiceNowPgtoClientParams) {
    super({
      baseURL: new URL(
        '/api/x_mdpdd_pgto/v1/pagamentos',
        params.config.serviceNow.api.baseUrl
      ).toString(),
      logger: params.logger
    })
  }

  async listaDebitos (auth: DetranSpServiceNowClientAuthWithVeiculo): Promise<ListaDebitosResult> {
    return (
      await this.axios.get('/debitos', {
        ...this.withAuth(auth),
        params: { placa: auth.placa, renavam: auth.renavam, cpf: auth.userCpf }
      })
    ).data
  }

  async listaTiposServico (auth: DetranSpServiceNowClientAuth): Promise<ListaTiposServicoResult> {
    return (await this.axios.get('/tipos-servico', this.withAuth(auth))).data
  }

  async criaPix (auth: DetranSpServiceNowClientAuthWithVeiculo, body: CriaPixBody): Promise<PixResult> {
    return (
      await this.axios.post('/pix', body, { ...this.withAuth(auth), timeout: PIX_TIMEOUT_MS })
    ).data
  }

  async verificaPix (auth: DetranSpServiceNowClientAuthWithVeiculo, idSolServico: string): Promise<PixResult> {
    return (await this.axios.get(`/pix/${idSolServico}`, this.withAuth(auth))).data
  }
}
