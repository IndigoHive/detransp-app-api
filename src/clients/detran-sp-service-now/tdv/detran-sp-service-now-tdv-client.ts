import type { Logger } from 'pino'
import type { Config } from '../../../types'
import { DetranSpServiceNowHttp } from '../detran-sp-service-now-http'
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
      baseURL: config.serviceNow.tdv.baseUrl,
      logger,
      auth: {
        username: config.serviceNow.tdv.username,
        password: config.serviceNow.tdv.password
      }
    })
  }

  async listaVeiculosProprietario (token: string): Promise<ListaVeiculosProprietarioResult> {
    return (
      await this.axios.get<ListaVeiculosProprietarioResult>('/veiculos', {
        headers: { Authorization: `Bearer ${token}` }
      })
    ).data
  }

  async listaTdvs (token: string, query: ListTdvsQuery): Promise<ListaTdvsResult> {
    return (
      await this.axios.get<ListaTdvsResult>('/transferencias-de-veiculos', {
        params: query,
        headers: { Authorization: `Bearer ${token}` }
      })
    ).data
  }

  async buscaTdv (token: string, codigoTransferenciaVeiculo: string): Promise<BuscaTdvResult> {
    return (
      await this.axios.get<BuscaTdvResult>(
        `/transferencias-de-veiculos/${codigoTransferenciaVeiculo}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
    ).data
  }

  async criaTdv (token: string, data: CriaTdvCommand): Promise<CriaTdvResult> {
    return (
      await this.axios.post<CriaTdvResult>('/transferencias-de-veiculos', data, {
        headers: { Authorization: `Bearer ${token}` }
      })
    ).data
  }

  async atualizaTdv (
    token: string,
    codigoTransferenciaVeiculo: string,
    data: AtualizaTdvCommand
  ): Promise<AtualizaTdvResult> {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` }

    if ('itiCode' in data) {
      headers['X-Authorization-Code'] = data.itiCode
    }

    return (
      await this.axios.patch<AtualizaTdvResult>(
        `/transferencias-de-veiculos/${codigoTransferenciaVeiculo}`,
        data,
        { headers }
      )
    ).data
  }

  async buscaCidadao (token: string, cpf: string): Promise<BuscaCidadaoResult> {
    return (
      await this.axios.get<BuscaCidadaoResult>(`/cidadaos/${cpf}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
    ).data
  }

  async buscaEndereco (token: string, cep: string): Promise<BuscaEnderecoResult> {
    return (
      await this.axios.get<BuscaEnderecoResult>(`/enderecos/${cep}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
    ).data
  }

  async buscaDebitosTdv (token: string, codigoTransferenciaVeiculo: string): Promise<BuscaDebitosTdvResult> {
    return (
      await this.axios.get<BuscaDebitosTdvResult>(
        `/transferencias-de-veiculos/${codigoTransferenciaVeiculo}/debitos`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
    ).data
  }

  async buscaPixQrCodeTdv (token: string, codigoTransferenciaVeiculo: string): Promise<BuscaPixQrCodeTdvResult> {
    return (
      await this.axios.get<BuscaPixQrCodeTdvResult>(
        `/transferencias-de-veiculos/${codigoTransferenciaVeiculo}/qr-code`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
    ).data
  }
}
