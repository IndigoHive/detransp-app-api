import createError from 'http-errors'
import type { RotaVidaClient } from '../../../clients/rota-vida'
import { extractBearerToken, extractCpfFromToken } from '../../../utils/token'

type Dependencies = {
  rotaVidaClient: RotaVidaClient
}

export type ProvaVidaInput = {
  imageBase64: string
}

export type ProvaVidaResult = {
  codigoProvaVida: string
}

export class ProvaVidaService {
  private readonly client: RotaVidaClient

  constructor ({ rotaVidaClient }: Dependencies) {
    this.client = rotaVidaClient
  }

  async run (authorizationHeader: string | undefined, input: ProvaVidaInput): Promise<ProvaVidaResult> {
    const token = extractBearerToken(authorizationHeader)
    const cpf = extractCpfFromToken(token)

    if (!cpf) {
      throw createError(400, 'CPF não encontrado no token.', { expose: true })
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

    if (match.confere !== 'true') {
      throw createError(422, 'Biometria facial não conferida.', { expose: true })
    }

    return { codigoProvaVida: prova.id }
  }
}
