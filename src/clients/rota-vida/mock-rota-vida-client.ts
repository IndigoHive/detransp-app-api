import { randomUUID } from 'crypto'
import {
  RotaVidaClient,
  type CriarProvaInput,
  type CriarProvaResult,
  type MatchBiometriaInput,
  type MatchBiometriaResult,
  type RotaVidaClientParams,
  type UploadFotoResult
} from './rota-vida-client'

/**
 * In-memory stand-in for {@link RotaVidaClient} used by TDV mock mode. `criarProva` returns a
 * fake prova id with no HTTP call, so `ProvaVidaService` (with `bypassMatch` on, which TDV mock
 * mode implies) short-circuits and returns the code without hitting rota-vida. `uploadFoto` and
 * `matchBiometria` are only reachable when `bypassMatch` is off, so they are defensive stubs.
 */
export class MockRotaVidaClient extends RotaVidaClient {
  constructor (params: RotaVidaClientParams) {
    super(params)
  }

  async criarProva (
    _accessToken: string,
    _integrityToken: string,
    _userAgent: string,
    body: CriarProvaInput
  ): Promise<CriarProvaResult> {
    const now = new Date()
    return {
      id: `MOCK-PV-${randomUUID()}`,
      cpf: body.cpf,
      dataCriacao: now.toISOString(),
      dataExpiracao: new Date(now.getTime() + body.tempoExpiracao * 60 * 1000).toISOString(),
      solicitante: body.solicitante,
      motivo: body.motivo,
      tempoExpiracao: body.tempoExpiracao,
      tempoReuso: body.tempoReuso,
      tentativas: 0,
      status: 1,
      tipo: body.tipo
    }
  }

  async uploadFoto (
    _accessToken: string,
    _cpf: string,
    _userAgent: string,
    _imageBuffer: Buffer
  ): Promise<UploadFotoResult> {
    const id = randomUUID()
    return {
      id,
      pathId: id,
      localId: id,
      relativePath: `/mock/${id}.png`,
      url: `http://rota-vida-mock.local/${id}.png`
    }
  }

  async matchBiometria (
    _accessToken: string,
    _integrityToken: string,
    _userAgent: string,
    _idProva: string,
    _body: MatchBiometriaInput
  ): Promise<MatchBiometriaResult> {
    return { confere: true, score: 1 }
  }
}
