import { randomUUID } from 'crypto'
import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios'
import createError from 'http-errors'
import type { Logger } from 'pino'
import { reportOutboundHttpError } from '../report-outbound-http-error'
import { installHttpMetrics } from '../install-http-metrics'

const SERVICE_NAME = 'rota-vida'

export type RotaVidaClientParams = {
  vidaBaseUrl: string
  arquivosBaseUrl: string
  logger: Logger
}

export type CriarProvaInput = {
  tipo: number
  cpf: string
  tempoExpiracao: number
  tempoReuso: number
  solicitante: string
  idSolicitante: string
  canalSolicitante: string
  motivo: string
  pushTitulo: string | null
  pushMensagem: string | null
}

export type CriarProvaResult = {
  id: string
  cpf: string
  dataCriacao: string
  dataExpiracao: string
  solicitante: string
  motivo: string
  tempoExpiracao: number
  tempoReuso: number
  tentativas: number
  status: number
  tipo: number
}

export type UploadFotoResult = {
  id: string
  pathId: string
  localId: string
  relativePath: string
  url: string
}

export type MatchBiometriaInput = {
  biometria: Array<{
    formato: string
    urlImagem: string
    tipo: string
  }>
  cpfAtendente: string
  identificador: {
    tipo: string
    numero: string
  }
  ipAtendente: string
  baseDeDados: string
  macAddressAtendente: string
}

export type MatchBiometriaResult = {
  confere: boolean
  score?: number
}

export class RotaVidaClient {
  private readonly vidaAxios: AxiosInstance
  private readonly arquivosAxios: AxiosInstance
  private readonly logger: Logger

  constructor ({ vidaBaseUrl, arquivosBaseUrl, logger }: RotaVidaClientParams) {
    this.logger = logger

    this.vidaAxios = axios.create({
      baseURL: vidaBaseUrl,
      headers: { 'Content-Type': 'application/json' }
    })

    this.arquivosAxios = axios.create({
      baseURL: arquivosBaseUrl
    })

    installHttpMetrics(this.vidaAxios, SERVICE_NAME)
    installHttpMetrics(this.arquivosAxios, SERVICE_NAME)
    this.setupInterceptors(this.vidaAxios)
    this.setupInterceptors(this.arquivosAxios)
  }

  private buildRequestMeta (config?: AxiosRequestConfig) {
    if (!config) return undefined
    return {
      baseURL: config.baseURL,
      method: config.method,
      url: config.url
    }
  }

  private setupInterceptors (instance: AxiosInstance) {
    instance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const meta = this.buildRequestMeta(error.config)
        const fullUrl = error.config
          ? `${error.config.baseURL ?? ''}${error.config.url ?? ''}`
          : 'unknown'

        this.logger.error(
          {
            ...meta,
            fullUrl,
            responseData: error.response?.data,
            service: SERVICE_NAME,
            status: error.response?.status,
            errorCode: error.code,
            errorMessage: error.message,
          },
          'Rota Vida HTTP error'
        )
        reportOutboundHttpError(error, SERVICE_NAME)

        const message = error.response?.status === 401 || error.response?.status === 403
          ? 'Sessão expirada. Faça login novamente.'
          : 'Tivemos um problema ao processar sua solicitação.'

        throw createError(error.response?.status ?? 502, message, { expose: true })
      }
    )
  }

  async criarProva (
    accessToken: string,
    integrityToken: string,
    userAgent: string,
    body: CriarProvaInput
  ): Promise<CriarProvaResult> {
    const response = await this.vidaAxios.post<CriarProvaResult>('/prova/v3', body, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-User-AppSP': integrityToken,
        'User-Agent': userAgent
      }
    })
    return response.data
  }

  async uploadFoto (
    accessToken: string,
    cpf: string,
    userAgent: string,
    imageBuffer: Buffer
  ): Promise<UploadFotoResult> {
    const uploadId = randomUUID()
    const response = await this.arquivosAxios.post<UploadFotoResult>(
      `/ds/${uploadId}`,
      imageBuffer,
      {
        headers: {
          'X-TraceId-SP': '10',
          CPF: cpf,
          'Content-Type': 'image/png',
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': userAgent
        }
      }
    )
    return response.data
  }

  async matchBiometria (
    accessToken: string,
    integrityToken: string,
    userAgent: string,
    idProva: string,
    body: MatchBiometriaInput
  ): Promise<MatchBiometriaResult> {
    const response = await this.vidaAxios.post<MatchBiometriaResult>('/match/v3', body, {
      headers: {
        idProva,
        Authorization: `Bearer ${accessToken}`,
        'X-User-AppSP': integrityToken,
        'User-Agent': userAgent
      }
    })
    return response.data
  }
}
