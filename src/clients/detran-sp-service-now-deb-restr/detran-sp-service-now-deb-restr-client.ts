import type { Logger } from 'pino'
import type { Config } from '../../types'
import {
  type DetranSpServiceNowClientAuth,
  type DetranSpServiceNowClientAuthWithVeiculo,
  DetranSpServiceNowDebRestrHttp
} from './detran-sp-service-now-deb-restr-http'
import type {
  BuscaVeiculoResult,
  CertidaoListagemResult,
  CertidaoResult,
  CriaCertidaoResult,
  DocumentoCertidaoPorIdResult,
  DocumentoCertidaoResult,
  ListaVeiculosResult,
  QRCodeCertidaoResult,
  Renavam,
  TaxaCertidaoResult
} from './types'

const DEBITOS_INCLUDE = 'debitos-ipva,debitos-milt,debitos-renainf,debitos-licenciamento'

export type DetranSpServiceNowDebRestrClientParams = {
  config: Config
  logger: Logger
}

export class DetranSpServiceNowDebRestrClient extends DetranSpServiceNowDebRestrHttp {
  constructor (params: DetranSpServiceNowDebRestrClientParams) {
    super({
      baseURL: new URL(
        '/api/x_mdpdd_deb_restr/v1/consulta_debitos_restricoes/veiculos',
        params.config.serviceNow.api.baseUrl
      ).toString(),
      logger: params.logger
    })
  }

  async listaVeiculos (auth: DetranSpServiceNowClientAuth): Promise<ListaVeiculosResult> {
    return (await this.axios.get('', this.withAuth(auth))).data
  }

  async buscaVeiculo (
    auth: DetranSpServiceNowClientAuthWithVeiculo,
    renavam: Renavam,
    options?: { includeProcedencia?: boolean }
  ): Promise<BuscaVeiculoResult> {
    const include = options?.includeProcedencia ? `${DEBITOS_INCLUDE},procedencia` : DEBITOS_INCLUDE
    return (
      await this.axios.get(`/${renavam}/placa/${auth.placa}`, {
        ...this.withAuth(auth),
        params: { include }
      })
    ).data
  }

  async buscaCertidao (auth: DetranSpServiceNowClientAuthWithVeiculo, renavam: Renavam): Promise<CertidaoResult> {
    return (
      await this.axios.get(`/${renavam}/placa/${auth.placa}/relationships/certidao`, this.withAuth(auth))
    ).data
  }

  async buscaTaxaCertidao (auth: DetranSpServiceNowClientAuthWithVeiculo, renavam: Renavam): Promise<TaxaCertidaoResult> {
    return (
      await this.axios.get(`/${renavam}/placa/${auth.placa}/relationships/taxa-certidao`, this.withAuth(auth))
    ).data
  }

  async criaQRCodeCertidao (auth: DetranSpServiceNowClientAuthWithVeiculo, renavam: Renavam): Promise<QRCodeCertidaoResult> {
    return (
      await this.axios.post(
        `/${renavam}/placa/${auth.placa}/relationships/taxa-certidao/relationships/qr-code`,
        null,
        this.withAuth(auth)
      )
    ).data
  }

  async verificaQRCodeCertidao (auth: DetranSpServiceNowClientAuthWithVeiculo, renavam: Renavam): Promise<QRCodeCertidaoResult> {
    return (
      await this.axios.get(
        `/${renavam}/placa/${auth.placa}/relationships/taxa-certidao/relationships/qr-code`,
        this.withAuth(auth)
      )
    ).data
  }

  async criaCertidao (auth: DetranSpServiceNowClientAuthWithVeiculo, renavam: Renavam): Promise<CriaCertidaoResult> {
    return (
      await this.axios.post(`/${renavam}/placa/${auth.placa}/relationships/certidao`, null, this.withAuth(auth))
    ).data
  }

  async buscaDocumentoCertidao (auth: DetranSpServiceNowClientAuthWithVeiculo, renavam: Renavam): Promise<DocumentoCertidaoResult> {
    return (
      await this.axios.get(
        `/${renavam}/placa/${auth.placa}/relationships/certidao/relationships/documento`,
        this.withAuth(auth)
      )
    ).data
  }

  async listaCertidoes (auth: DetranSpServiceNowClientAuthWithVeiculo): Promise<CertidaoListagemResult> {
    return (
      await this.axios.get(`/relationships/certidao/cpf/${auth.userCpf}`, this.withAuth(auth))
    ).data
  }

  async buscaDocumentoCertidaoPorId (
    auth: DetranSpServiceNowClientAuthWithVeiculo,
    sysId: string
  ): Promise<DocumentoCertidaoPorIdResult> {
    return (
      await this.axios.get(`/relationships/certidao/${sysId}/relationships/documento`, this.withAuth(auth))
    ).data
  }
}
