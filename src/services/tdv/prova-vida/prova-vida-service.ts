import createError from 'http-errors'
import type { Logger } from 'pino'
import type { RotaVidaClient } from '../../../clients/rota-vida'
import type { Config } from '../../../types'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'

type Dependencies = {
  rotaVidaClient: RotaVidaClient
  config: Config
  logger: Logger
}

export type ProvaVidaInput = {
  imageBase64: string
}

export type ProvaVidaResult = {
  codigoProvaVida: string
}

export class ProvaVidaService {
  private readonly client: RotaVidaClient
  private readonly bypassMatch: boolean
  private readonly logger: Logger

  constructor ({ rotaVidaClient, config, logger }: Dependencies) {
    this.client = rotaVidaClient
    this.bypassMatch = config.rotaVida.bypassMatch
    this.logger = logger
  }

  async run (authorizationHeader: string | undefined, input: ProvaVidaInput): Promise<ProvaVidaResult> {
    const token = extractBearerToken(authorizationHeader)
    const cpf = extractCpfFromToken(token)

    if (!cpf) {
      throw createError(401, 'Token de autorização inválido ou expirado.', { expose: true })
    }

    const integrityToken = token
    const userAgent = 'WhatsApp/appsp/1.0.0'

    const prova = await this.client.criarProva(token, integrityToken, userAgent, {
      tipo: 1,
      cpf,
      tempoExpiracao: 1440,
      tempoReuso: 1,
      solicitante: 'TDV',
      idSolicitante: '3',
      canalSolicitante: 'spgovbr',
      motivo: 'tdv',
      pushTitulo: null,
      pushMensagem: null
    })

    if (this.bypassMatch) {
      this.logger.warn(
        { codigoProvaVida: prova.id },
        'LIVENESS_BYPASS_MATCH ativo: pulando upload de foto e chamada real a /match/v3, biometria considerada conferida'
      )
      return { codigoProvaVida: prova.id }
    }

    const imageBuffer = Buffer.from(input.imageBase64, 'base64')

    const upload = await this.client.uploadFoto(token, cpf, userAgent, imageBuffer)

    const match = await this.client.matchBiometria(token, integrityToken, userAgent, prova.id, {
      biometria: [{
        formato: 'PNG',
        urlImagem: upload.relativePath,
        tipo: 'FACIAL'
      }],
      cpfAtendente: cpf,
      identificador: {
        tipo: 'CPF',
        numero: cpf
      },
      ipAtendente: '0.0.0.0',
      baseDeDados: '1',
      macAddressAtendente: '00:00:00:00:00:00'
    })

    if (match.confere !== true) {
      throw createError(422, 'Biometria facial não conferida.', { expose: true })
    }

    return { codigoProvaVida: prova.id }
  }
}
