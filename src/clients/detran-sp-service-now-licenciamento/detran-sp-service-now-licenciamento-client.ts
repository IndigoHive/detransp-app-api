import type { Logger } from 'pino'
import type { Config } from '../../types'
import {
  type DetranSpServiceNowClientAuth,
  type DetranSpServiceNowClientAuthWithVeiculo,
  DetranSpServiceNowLicenciamentoHttp
} from './detran-sp-service-now-licenciamento-http'
import type {
  BuscaCRLVeResult,
  BuscaVeiculoResult,
  CriaQRCodeResult,
  ListaDebitosVeiculoResult,
  ListaMultasResult,
  ListaVeiculosResult,
  Renavam,
  VerificaQRCodeResult,
  VerificaVeiculoResult
} from './types'

export type DetranSpServiceNowLicenciamentoClientParams = {
  config: Config
  logger: Logger
}

export class DetranSpServiceNowLicenciamentoClient extends DetranSpServiceNowLicenciamentoHttp {
  constructor (params: DetranSpServiceNowLicenciamentoClientParams) {
    super({
      baseURL: new URL(
        '/api/x_mdpdd_lic_veic/v1/licenciamento/veiculos',
        params.config.serviceNow.api.baseUrl
      ).toString(),
      logger: params.logger
    })
  }

  async buscaCrlve (auth: DetranSpServiceNowClientAuthWithVeiculo, renavam: Renavam): Promise<BuscaCRLVeResult> {
    return (await this.axios.get(`/${renavam}/crlv-e`, this.withAuth(auth))).data
  }

  async criaQRCode (auth: DetranSpServiceNowClientAuthWithVeiculo, renavam: Renavam): Promise<CriaQRCodeResult> {
    return (await this.axios.post(`/${renavam}/qr-code`, null, this.withAuth(auth))).data
  }

  async listaDebitosVeiculo (
    auth: DetranSpServiceNowClientAuthWithVeiculo,
    renavam: Renavam
  ): Promise<ListaDebitosVeiculoResult> {
    return (await this.axios.get(`/${renavam}/debitos`, this.withAuth(auth))).data
  }

  async listaVeiculos (auth: DetranSpServiceNowClientAuth): Promise<ListaVeiculosResult> {
    return (await this.axios.get('', this.withAuth(auth))).data
  }

  async verificaQRCode (auth: DetranSpServiceNowClientAuthWithVeiculo, renavam: Renavam): Promise<VerificaQRCodeResult> {
    return (await this.axios.get(`/${renavam}/qr-code`, this.withAuth(auth))).data
  }

  async listaMultas (
    auth: DetranSpServiceNowClientAuthWithVeiculo,
    renavam: Renavam
  ): Promise<ListaMultasResult> {
    return (await this.axios.get(`/${renavam}/multas`, this.withAuth(auth))).data
  }

  async buscaVeiculo (
    auth: DetranSpServiceNowClientAuthWithVeiculo,
    renavam: Renavam
  ): Promise<BuscaVeiculoResult> {
    return (await this.axios.get(`/${renavam}`, this.withAuth(auth))).data
  }

  async verificaVeiculo (
    auth: DetranSpServiceNowClientAuthWithVeiculo,
    renavam: Renavam
  ): Promise<VerificaVeiculoResult> {
    return (await this.axios.post(`/${renavam}`, null, this.withAuth(auth))).data
  }
}
