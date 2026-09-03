import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios'
import createError from 'http-errors'
import type { Logger } from 'pino'
import { reportOutboundHttpError } from '../report-outbound-http-error'
import { installHttpMetrics } from '../install-http-metrics'

const SERVICE_NAME = 'rota-caixa-postal'

export type CaixaPostalClientParams = {
  baseUrl: string
  appTopic: string
  logger: Logger
}

export type CaixaPostalMensagem = {
  id: string
  codMensagem: string | null
  titulo: string | null
  mensagemCurta: string | null
  mensagemLonga: string | null
  dataEnvio: string
  lida: boolean
}

type RotaCaixaPostalMensagemRaw = {
  id: string
  codMensagem?: string | null
  titulo: string | null
  mensagemCurta: string | null
  mensagemLonga?: string | null
  dataEnvio: string
  status: number
}

function mapMensagem(raw: RotaCaixaPostalMensagemRaw): CaixaPostalMensagem {
  return {
    id: raw.id,
    codMensagem: raw.codMensagem ?? null,
    titulo: raw.titulo ?? null,
    mensagemCurta: raw.mensagemCurta ?? null,
    mensagemLonga: raw.mensagemLonga ?? null,
    dataEnvio: raw.dataEnvio,
    lida: raw.status === 2,
  }
}

export type CaixaPostalBadgeResponse = {
  badge: number
}

export class RotaCaixaPostalClient {
  private readonly axios: AxiosInstance
  private readonly appTopic: string
  private readonly logger: Logger

  constructor({ baseUrl, appTopic, logger }: CaixaPostalClientParams) {
    this.appTopic = appTopic
    this.logger = logger

    this.axios = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DetranApp/1.0',
      },
    })

    installHttpMetrics(this.axios, SERVICE_NAME)
    this.setupInterceptors()
  }

  private withAuth(accessToken: string) {
    return { headers: { Authorization: `Bearer ${accessToken}` } }
  }

  private withAuthAndCpf(accessToken: string, cpf: string) {
    return {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        CPF: cpf,
      },
    }
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

        this.logger.error(
          { ...meta, responseData: error.response?.data, service: SERVICE_NAME, status: error.response?.status },
          'Rota Caixa Postal HTTP error',
        )
        reportOutboundHttpError(error, SERVICE_NAME)

        const message = error.response?.status === 401 || error.response?.status === 403
          ? 'Sessão expirada. Faça login novamente.'
          : 'Tivemos um problema ao processar sua solicitação.'

        throw createError(error.response?.status ?? 502, message, { expose: true })
      },
    )
  }

  async registrarDispositivo(
    accessToken: string,
    payload: { idPlataforma: string; key: string },
  ): Promise<void> {
    await this.axios.post('/dispositivos', payload, this.withAuth(accessToken))
    this.logger.debug({ key: payload.key }, 'Push device registered')
  }

  async atualizarTags(
    accessToken: string,
    payload: { key: string; tags: string[] },
  ): Promise<void> {
    await this.axios.put('/dispositivos/tags', payload, this.withAuth(accessToken))
  }

  async getBadge(accessToken: string, cpf: string): Promise<CaixaPostalBadgeResponse> {
    const response = await this.axios.get<CaixaPostalBadgeResponse>(
      `/mensagens/app/${this.appTopic}/badge`,
      this.withAuthAndCpf(accessToken, cpf),
    )
    if (!response.data || typeof response.data !== 'object') return { badge: 0 }
    return response.data
  }

  async listarMensagens(accessToken: string, cpf: string): Promise<CaixaPostalMensagem[]> {
    const response = await this.axios.get<RotaCaixaPostalMensagemRaw[]>(
      `/mensagens/app/${this.appTopic}`,
      this.withAuthAndCpf(accessToken, cpf),
    )
    this.logger.info({ data: response.data, service: SERVICE_NAME }, 'Rota Caixa Postal listagem de mensagens')
    if (!Array.isArray(response.data)) return []
    const mensagens = response.data.map(mapMensagem)
    this.logger.debug({ total: mensagens.length }, 'Mensagens retrieved')
    return mensagens
  }

  async getMensagem(accessToken: string, cpf: string, id: string): Promise<CaixaPostalMensagem> {
    const response = await this.axios.get<RotaCaixaPostalMensagemRaw>(
      `/mensagens/app/${this.appTopic}/id/${id}`,
      this.withAuthAndCpf(accessToken, cpf),
    )
    const mensagem = mapMensagem(response.data)
    this.logger.debug({ codMensagem: mensagem.codMensagem, id: mensagem.id }, 'Mensagem retrieved')

    return mensagem
  }
}
