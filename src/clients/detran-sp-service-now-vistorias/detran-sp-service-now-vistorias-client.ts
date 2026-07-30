import type { Logger } from 'pino'
import type { Config } from '../../types'
import { DetranSpServiceNowVistoriasHttp } from './detran-sp-service-now-vistorias-http'
import type {
  CriaQRCodeBody,
  CriaQRCodeResult,
  GeraDocumentoBody,
  GeraDocumentoResult,
  VerificaQRCodeResult,
  VerificaVeiculoBody,
  VerificaVeiculoResult
} from './types'

export type DetranSpServiceNowVistoriasClientParams = {
  config: Config
  logger: Logger
}

export class DetranSpServiceNowVistoriasClient extends DetranSpServiceNowVistoriasHttp {
  constructor (params: DetranSpServiceNowVistoriasClientParams) {
    super({
      baseURL: params.config.serviceNow.api.baseUrl,
      logger: params.logger
    })
  }

  async verificaVeiculo (
    body: VerificaVeiculoBody
  ): Promise<VerificaVeiculoResult> {
    return (await this.axios.post(
      '/api/x_mdpdd_pev/v1/pev/validar-veiculo-vistoria',
      body
    )).data
  }

  async criaQRCode (
    body: CriaQRCodeBody
  ): Promise<CriaQRCodeResult> {
    return (await this.axios.post(
      '/api/x_mdpdd_pev/v1/pev/gerar-cobranca',
      body
    )).data
  }

  async verificaQRCode (
    paymentId: string
  ): Promise<VerificaQRCodeResult> {
    return (await this.axios.get(
      '/api/x_mdpdd_pev/v1/pev/status-qr-code',
      { params: { paymentID: paymentId } }
    )).data
  }

  async geraDocumento (
    body: GeraDocumentoBody
  ): Promise<GeraDocumentoResult> {
    return (await this.axios.post(
      '/api/x_mdpdd_pev/v1/pev/gerar-documento',
      body
    )).data
  }
}
