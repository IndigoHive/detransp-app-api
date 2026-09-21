import { BadRequest } from 'http-errors'
import type { AttestationAgent, DetranSpServiceNowAttestationClient, ValidateAttestationTokenResult } from '../../../clients/detran-sp-service-now-attestation'

export class ValidateAttestationTokenService {
  private readonly attestationClient: DetranSpServiceNowAttestationClient

  constructor (options: { detranSpServiceNowAttestationClient: DetranSpServiceNowAttestationClient }) {
    this.attestationClient = options.detranSpServiceNowAttestationClient
  }

  async run (token: string, agent: AttestationAgent): Promise<ValidateAttestationTokenResult> {
    if (!token?.trim()) throw BadRequest('Token de atestação é obrigatório.')

    return await this.attestationClient.validateAttestationToken(token, agent)
  }
}
