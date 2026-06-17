import axios, { type AxiosInstance } from 'axios'
import type { Logger } from 'pino'

export type CaixaPostalClientParams = {
  baseUrl: string
  appTopic: string
  logger: Logger
}

export type CaixaPostalMensagem = {
  id: string
  assunto: string | null
  corpo: string | null
  data: string
  lida: boolean
}

type RotaCaixaPostalMensagemRaw = {
  id: string
  titulo: string | null
  mensagemCurta: string | null
  mensagemLonga?: string | null
  dataEnvio: string
  status: number
}

function mapMensagem(raw: RotaCaixaPostalMensagemRaw): CaixaPostalMensagem {
  return {
    id: raw.id,
    assunto: raw.titulo ?? null,
    corpo: raw.mensagemLonga ?? raw.mensagemCurta ?? null,
    data: raw.dataEnvio,
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
  }

  async getBadge(accessToken: string): Promise<CaixaPostalBadgeResponse> {
    const response = await this.axios.get<CaixaPostalBadgeResponse>(
      `/mensagens/app/${this.appTopic}/badge`,
      this.withAuth(accessToken),
    )
    return response.data
  }

  async listarMensagens(accessToken: string): Promise<CaixaPostalMensagem[]> {
    const response = await this.axios.get<RotaCaixaPostalMensagemRaw[]>(
      `/mensagens/app/${this.appTopic}`,
      this.withAuth(accessToken),
    )
    return response.data.map(mapMensagem)
  }

  async getMensagem(accessToken: string, id: string): Promise<CaixaPostalMensagem> {
    const response = await this.axios.get<RotaCaixaPostalMensagemRaw>(
      `/mensagens/app/${this.appTopic}/id/${id}`,
      this.withAuth(accessToken),
    )
    return mapMensagem(response.data)
  }
}
