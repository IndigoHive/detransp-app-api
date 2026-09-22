import axios, { type AxiosError, type AxiosInstance } from 'axios'
import createError from 'http-errors'
import type { Logger } from 'pino'
import type { Config } from '../../types'
import { reportOutboundHttpError } from '../report-outbound-http-error'
import { installHttpMetrics } from '../install-http-metrics'

const SERVICE_NAME = 'detran-sp-servicenow-attestation'
const MAX_TIMEOUT_MS = 28000

// "Detran-SP" (este app, pacote br.gov.sp.detran.consultas) x "Detran-SP+"
// (o outro app, br.gov.sp.detran) mapeiam para origemApp diferentes no
// contrato do ServiceNow — ver documentação do endpoint de attestation.
const ORIGEM_APP = 'detranconsultas'

export type DetranSpServiceNowAttestationClientParams = {
  config: Config
  logger: Logger
}

export type AttestationAgent = 'android' | 'ios'

export type ValidateAttestationTokenResult = {
  accessToken: string
}

// Formato documentado da resposta — no caminho de erro o ServiceNow devolve
// um "result" aninhado dentro do "result" externo (em vez dos campos
// statusCode/error/message/data ficarem direto no externo, como no sucesso).
// Confirmado em teste real: o erro também chega como status HTTP não-2xx (ex.
// 400), não só como HTTP 200 com error:true no corpo — daí extractResult ser
// usado tanto no sucesso quanto no interceptor de erro.
type AttestationApiResult = {
  statusCode?: number
  error?: boolean
  message?: string
  data?: { token?: string } | null
  result?: AttestationApiResult
}

type AttestationApiResponse = {
  result: AttestationApiResult
}

function extractResult (data: unknown): AttestationApiResult | undefined {
  const outer = (data as AttestationApiResponse | undefined)?.result
  if (!outer) return undefined
  return outer.result ?? outer
}

// Extraída como função pura pra ser testável sem precisar disparar a
// pipeline de interceptors do axios de fato (que mocks em teste tendem a
// contornar por completo — foi assim que a mensagem real de erro do
// ServiceNow ficou sem cobertura até aparecer em teste manual).
export function buildAttestationError (responseData: unknown): Error {
  const upstreamResult = extractResult(responseData)

  if (upstreamResult?.message) {
    return createError(401, upstreamResult.message, { expose: true })
  }

  return createError(502, 'Não foi possível validar o token de atestação.', { expose: true })
}

export class DetranSpServiceNowAttestationClient {
  private readonly axios: AxiosInstance
  private readonly logger: Logger

  constructor ({ config, logger }: DetranSpServiceNowAttestationClientParams) {
    this.logger = logger

    this.axios = axios.create({
      baseURL: new URL('/api/x_mdpdd_idpsp_spok', config.serviceNow.api.baseUrl).toString(),
      headers: { 'Content-Type': 'application/json' },
      timeout: MAX_TIMEOUT_MS
    })

    installHttpMetrics(this.axios, SERVICE_NAME)
    this.setupInterceptors()
  }

  private setupInterceptors () {
    this.axios.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // responseData vai pro log (não pro Sentry, via reportOutboundHttpError
        // abaixo) — sem isso, um 400/403 real do ServiceNow virava só
        // "status: 400" no log, sem pista de qual campo o contrato rejeitou.
        this.logger.error(
          {
            service: SERVICE_NAME,
            status: error.response?.status,
            url: error.config?.url,
            responseData: error.response?.data
          },
          'ServiceNow attestation response error'
        )
        reportOutboundHttpError(error, SERVICE_NAME)

        throw buildAttestationError(error.response?.data)
      }
    )
  }

  // Confirmado em teste manual contra o endpoint real: o campo é "agent" (inglês),
  // não "agente" como a documentação/exemplo de request mostrava.
  async validateAttestationToken (token: string, agent: AttestationAgent): Promise<ValidateAttestationTokenResult> {
    this.logger.info({ service: SERVICE_NAME, agent, token }, 'Validating attestation token');
    const response = await this.axios.post<AttestationApiResponse>('/attestation', {
      agent,
      origemApp: ORIGEM_APP,
      token
    })

    const inner = extractResult(response.data)

    if (!inner || inner.error || inner.statusCode !== 200 || !inner.data?.token) {
      this.logger.error(
        { service: SERVICE_NAME, status: response.status, url: '/attestation', responseData: response.data },
        'ServiceNow attestation logical error'
      )
      throw createError(401, inner?.message ?? 'Token de atestação inválido ou expirado.', { expose: true })
    }

    return { accessToken: inner.data.token }
  }
}
