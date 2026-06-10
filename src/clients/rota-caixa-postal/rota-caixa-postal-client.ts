import axios, { type AxiosInstance } from 'axios'
import type { Logger } from 'pino'

export type CaixaPostalClientParams = {
  baseUrl: string
  appTopic: string
  logger: Logger
}

export type CaixaPostalMensagem = {
  id: string
  assunto: string
  corpo: string
  data: string
  lida: boolean
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
  }

  private withAuth(accessToken: string) {
    return { headers: { Authorization: `Bearer ${accessToken}` } }
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
    this.logger.debug({ key: payload.key, tags: payload.tags }, 'Push device tags updated')
  }

  async getBadge(accessToken: string): Promise<CaixaPostalBadgeResponse> {
    const response = await this.axios.get<CaixaPostalBadgeResponse>(
      `/mensagens/app/${this.appTopic}/badge`,
      this.withAuth(accessToken),
    )
    return response.data
  }

  async listarMensagens(accessToken: string): Promise<CaixaPostalMensagem[]> {
    const response = await this.axios.get<CaixaPostalMensagem[]>(
      `/mensagens/app/${this.appTopic}`,
      this.withAuth(accessToken),
    )
    return response.data
  }

  async getMensagem(accessToken: string, id: string): Promise<CaixaPostalMensagem> {
    const response = await this.axios.get<CaixaPostalMensagem>(
      `/mensagens/app/${this.appTopic}/id/${id}`,
      this.withAuth(accessToken),
    )
    return response.data
  }
}
