import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios'
import createError from 'http-errors'
import type { Logger } from 'pino'

const SERVICE_NAME = 'rota-crv-pecas'

export type RotaCrvPecasClientParams = {
  baseUrl: string
  logger: Logger
}

export type PecaRaw = {
  numero: string | null
  logradouro: string | null
  telefoneNumero: string | null
  cor: string | null
  anoModelo: string | null
  complemento: string | null
  nomeEmpresa: string | null
  cidade: string | null
  renavam: string | null
  chassi: string | null
  bairro: string | null
  numeroPeca: string
  modelo: string | null
  combustivel: string | null
  cep: string | null
  email: string | null
  tipoPeca: string | null
  cnpj: string | null
  placa: string | null
  classificacao: string | null
  telefoneDDD: string | null
  anoFabricacao: string | null
  estado: string | null
}

export type BuscaPecaResponse = {
  peca: PecaRaw[]
}

export type ArquivoPecaRaw = {
  url: string
  descricao: string | null
  sequencia: number
  extensao: string
  codigo: string
}

export type BuscaArquivosResponse = {
  resultado: ArquivoPecaRaw[]
  retorno: Array<{ codRetorno: string; registros: number; mensagem: string }>
}

export class RotaCrvPecasClient {
  private readonly axios: AxiosInstance
  private readonly logger: Logger

  constructor({ baseUrl, logger }: RotaCrvPecasClientParams) {
    this.logger = logger

    this.axios = axios.create({
      baseURL: baseUrl,
      headers: { 'Content-Type': 'application/json' },
    })

    this.setupInterceptors()
  }

  private withAuth(accessToken: string) {
    return { headers: { Authorization: `Bearer ${accessToken}` } }
  }

  private buildRequestMeta(config?: AxiosRequestConfig) {
    if (!config) return undefined

    return {
      baseURL: config.baseURL,
      method: config.method,
      url: config.url,
    }
  }

  private setupInterceptors() {
    this.axios.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const meta = this.buildRequestMeta(error.config)
        const status = error.response?.status
        const data = error.response?.data as Record<string, unknown> | undefined

        this.logger.error(
          { ...meta, responseData: data, service: SERVICE_NAME, status },
          'Rota CRV Peças HTTP error',
        )

        if (status === 403) {
          throw createError(403, 'Serviço indisponível no momento.', { expose: true })
        }

        if (status === 400 || status === 404) {
          const retorno = data?.retorno as Array<{ mensagem?: string }> | { mensagem?: string } | undefined
          const upstreamMessage =
            data?.mensagem ??
            data?.message ??
            (Array.isArray(retorno) ? retorno[0]?.mensagem : retorno?.mensagem) ??
            'Peça não encontrada.'
          throw createError(status, String(upstreamMessage), { expose: true })
        }

        throw createError(status ?? 502, 'Erro interno do sistema.', { expose: true })
      },
    )
  }

  async buscaPeca(accessToken: string, numero: string): Promise<BuscaPecaResponse> {
    const response = await this.axios.get<BuscaPecaResponse>(
      `/v2/pecas/${numero}`,
      this.withAuth(accessToken),
    )
    return response.data
  }

  async buscaArquivos(accessToken: string, numero: string): Promise<BuscaArquivosResponse> {
    const response = await this.axios.get<BuscaArquivosResponse>(
      `/v2/pecas/arquivos/${numero}`,
      this.withAuth(accessToken),
    )
    return response.data
  }
}
