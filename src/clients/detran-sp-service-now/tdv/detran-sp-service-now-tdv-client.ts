import type { Logger } from 'pino'
import type { Config } from '../../../types'
import { DetranSpServiceNowAuth, DetranSpServiceNowHttp } from '../detran-sp-service-now-http'
import type {
  AtualizaTdvCommand,
  AtualizaTdvResult,
  BuscaCidadaoResult,
  BuscaDebitosTdvResult,
  BuscaEnderecoResult,
  BuscaPixQrCodeTdvResult,
  BuscaTdvResult,
  CriaTdvCommand,
  CriaTdvResult,
  ListaTdvsResult,
  ListTdvsQuery,
  ListaVeiculosProprietarioResult
} from './types'

export type DetranSpServiceNowTdvClientParams = {
  config: Config
  logger: Logger
}

export class DetranSpServiceNowTdvClient extends DetranSpServiceNowHttp {
  constructor ({ config, logger }: DetranSpServiceNowTdvClientParams) {
    super({
      baseURL: new URL('/api/x_mdpdd_be_tdv/v1/tdv', config.serviceNow.api.baseUrl).toString(),
      logger,
      userAgent: 'Android/appdt/1.0.0',
    })
  }

  async listaVeiculosProprietario (auth: DetranSpServiceNowAuth): Promise<ListaVeiculosProprietarioResult> {
    return (
      await this.axios.get<ListaVeiculosProprietarioResult>('/veiculos', this.withAuth(auth))
    ).data
  }

  async listaTdvs (auth: DetranSpServiceNowAuth, query: ListTdvsQuery): Promise<ListaTdvsResult> {
    return (
      await this.axios.get<ListaTdvsResult>('/transferencias-de-veiculos', {
        params: query,
        ...this.withAuth(auth)
      })
    ).data
  }

  async buscaTdv (
    auth: DetranSpServiceNowAuth,
    codigoTransferenciaVeiculo: string,
    campos?: string
  ): Promise<BuscaTdvResult> {
    return (
      await this.axios.get<BuscaTdvResult>(
        `/transferencias-de-veiculos/${codigoTransferenciaVeiculo}`,
        {
          ...(campos ? { params: { campos } } : {}),
          ...this.withAuth(auth)
        }
      )
    ).data
  }

  async criaTdv (auth: DetranSpServiceNowAuth, data: CriaTdvCommand): Promise<CriaTdvResult> {
    return (
      await this.axios.post<CriaTdvResult>('/transferencias-de-veiculos', data, this.withAuth(auth))
    ).data
  }

  async atualizaTdv (
    auth: DetranSpServiceNowAuth,
    codigoTransferenciaVeiculo: string,
    data: AtualizaTdvCommand
  ): Promise<AtualizaTdvResult> {
    const authConfig = this.withAuth(auth)
    // The signing authorization code travels only via X-Authorization-Code — ServiceNow
    // rejects the request if itiCode is also present in the body (see detran-app-kotlin's
    // assinarAtpveBody, which only ever sends { estado }).
    const { itiCode, ...body } = data as AtualizaTdvCommand & { itiCode?: string }
    const headers = {
      ...authConfig.headers,
      ...(itiCode ? { 'X-Authorization-Code': itiCode } : {})
    }

    return (
      await this.axios.patch<AtualizaTdvResult>(
        `/transferencias-de-veiculos/${codigoTransferenciaVeiculo}`,
        body,
        { headers }
      )
    ).data
  }

  async buscaCidadao (auth: DetranSpServiceNowAuth, cpf: string): Promise<BuscaCidadaoResult> {
    return (
      await this.axios.get<BuscaCidadaoResult>(`/cidadaos/${cpf}`, this.withAuth(auth))
    ).data
  }

  async buscaEndereco (auth: DetranSpServiceNowAuth, cep: string): Promise<BuscaEnderecoResult> {
    return (
      await this.axios.get<BuscaEnderecoResult>(`/enderecos/${cep}`, this.withAuth(auth))
    ).data
  }

  async buscaDebitosTdv (auth: DetranSpServiceNowAuth, codigoTransferenciaVeiculo: string): Promise<BuscaDebitosTdvResult> {
    return (
      await this.axios.get<BuscaDebitosTdvResult>(
        `/transferencias-de-veiculos/${codigoTransferenciaVeiculo}/debitos`,
        this.withAuth(auth)
      )
    ).data
  }

  async buscaPixQrCodeTdv (
    auth: DetranSpServiceNowAuth,
    codigoTransferenciaVeiculo: string,
    forcarNovo: boolean
  ): Promise<BuscaPixQrCodeTdvResult> {
    return (
      await this.axios.get<BuscaPixQrCodeTdvResult>(
        `/transferencias-de-veiculos/${codigoTransferenciaVeiculo}/qr-code`,
        { ...this.withAuth(auth), params: { forcarNovo } }
      )
    ).data
  }
}
