import type { Logger } from 'pino'
import type { Config } from '../../types'
import type { DetranSpServiceNowAuth } from '../detran-sp-service-now/detran-sp-service-now-http'
import { DetranSpServiceNowVistoriasHttp } from './detran-sp-service-now-vistorias-http'
import type {
  BuscaDocumentoVistoriaResult,
  BuscaDocumentoRestituicaoResult,
  ConsultaComprovanteRestituicaoResult,
  CriaQRCodeBody,
  CriaQRCodeResult,
  GeraDocumentoBody,
  GeraDocumentoResult,
  ListaPagamentosResult,
  SolicitaRestituicaoBody,
  SolicitaRestituicaoResult,
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
      logger: params.logger,
      serviceName: 'detran-sp-servicenow-vistorias',
      userAgent: 'iOS/appsp/1.0.0',
      withCredentials: true
    })
  }

  async verificaVeiculo (
    auth: DetranSpServiceNowAuth,
    body: VerificaVeiculoBody
  ): Promise<VerificaVeiculoResult> {
    return (await this.axios.post(
      '/api/x_mdpdd_pev/v1/pev/validar-veiculo-vistoria',
      body,
      this.withAuth(auth)
    )).data
  }

  async criaQRCode (
    auth: DetranSpServiceNowAuth,
    body: CriaQRCodeBody
  ): Promise<CriaQRCodeResult> {
    return (await this.axios.post(
      '/api/x_mdpdd_pev/v1/pev/gerar-cobranca',
      body,
      this.withAuth(auth)
    )).data
  }

  async verificaQRCode (
    auth: DetranSpServiceNowAuth,
    paymentId: string
  ): Promise<VerificaQRCodeResult> {
    return (await this.axios.get(
      '/api/x_mdpdd_pev/v1/pev/status-qr-code',
      { ...this.withAuth(auth), params: { paymentID: paymentId } }
    )).data
  }

  async geraDocumento (
    auth: DetranSpServiceNowAuth,
    body: GeraDocumentoBody
  ): Promise<GeraDocumentoResult> {
    return (await this.axios.post(
      '/api/x_mdpdd_pev/v1/pev/gerar-documento',
      body,
      this.withAuth(auth)
    )).data
  }

  async listaPagamentos (
    auth: DetranSpServiceNowAuth,
    documento: string,
    docProprietario: boolean,
    renavam?: string
  ): Promise<ListaPagamentosResult> {
    return (await this.axios.get(
      `/api/x_mdpdd_pev/v1/pev/restituicao/listapagamentos/${documento}`,
      { ...this.withAuth(auth), params: { docProprietario, renavam, pageSize: 100 } }
    )).data
  }

  async solicitaRestituicao (
    auth: DetranSpServiceNowAuth,
    body: SolicitaRestituicaoBody
  ): Promise<SolicitaRestituicaoResult> {
    return (await this.axios.post(
      '/api/x_mdpdd_pev/v1/pev/restituicao/solicitarrestituicao',
      body,
      this.withAuth(auth)
    )).data
  }

  async consultaComprovanteRestituicao (
    auth: DetranSpServiceNowAuth,
    idRestituicao: string
  ): Promise<ConsultaComprovanteRestituicaoResult> {
    return (await this.axios.get(
      `/api/x_mdpdd_pev/v1/pev/restituicao/restituicaocomprovante/${idRestituicao}`,
      this.withAuth(auth)
    )).data
  }

  async buscaDocumentoRestituicao (
    auth: DetranSpServiceNowAuth,
    numeroPEV: string
  ): Promise<BuscaDocumentoRestituicaoResult> {
    return (await this.axios.get(
      `/api/x_mdpdd_pev/v1/pev/restituicao/documentorestituicao/${numeroPEV}`,
      this.withAuth(auth)
    )).data
  }

  async buscaDocumentoVistoria (
    auth: DetranSpServiceNowAuth,
    numeroPEV: string
  ): Promise<BuscaDocumentoVistoriaResult> {
    return (await this.axios.get(
      `/api/x_mdpdd_pev/v1/pev/restituicao/consultadocumentovistoria/${numeroPEV}`,
      this.withAuth(auth)
    )).data
  }
}
