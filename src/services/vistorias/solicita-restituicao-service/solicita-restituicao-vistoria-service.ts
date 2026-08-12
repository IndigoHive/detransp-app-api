import type { DetranSpServiceNowVistoriasClient } from '../../../clients/detran-sp-service-now-vistorias'
import type { VistoriasAuth } from '../types'

export type SolicitaRestituicaoVistoriaOutput =
  | { success: true, status: 'completed' | 'processing', idRestituicao: string }
  | {
    success: false
    idRestituicao: null
    showSnackbar: {
      variant: 'error'
      title: string
      description: string
    }
  }

type SolicitaRestituicaoVistoriaServiceOptions = {
  maxAttempts?: number
  pollingIntervalMs?: number
}

const DEFAULT_MAX_ATTEMPTS = 10
const DEFAULT_POLLING_INTERVAL_MS = 2000

export class SolicitaRestituicaoVistoriaService {
  private readonly maxAttempts: number
  private readonly pollingIntervalMs: number

  constructor(
    private readonly client: DetranSpServiceNowVistoriasClient,
    options: SolicitaRestituicaoVistoriaServiceOptions = {}
  ) {
    this.maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS
    this.pollingIntervalMs = options.pollingIntervalMs ?? DEFAULT_POLLING_INTERVAL_MS
  }

  async run (
    auth: VistoriasAuth,
    token: string,
    documento: string
  ): Promise<SolicitaRestituicaoVistoriaOutput> {
    try {
      const result = await this.client.solicitaRestituicao(auth, { token, documento })
      const response = result?.result

      if (!response?.success) {
        return this.failure(response?.message)
      }

      return await this.waitForReceipt(auth, response.data.id)
    } catch (error) {
      return this.failure(error instanceof Error ? error.message : undefined)
    }
  }

  private async waitForReceipt (
    auth: VistoriasAuth,
    idRestituicao: string
  ): Promise<SolicitaRestituicaoVistoriaOutput> {
    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        const result = await this.client.consultaComprovanteRestituicao(auth, idRestituicao)
        const response = result?.result

        if (response?.success) {
          return { success: true, status: 'completed', idRestituicao }
        }
      } catch {}

      if (attempt < this.maxAttempts) {
        await this.wait()
      }
    }

    return { success: true, status: 'processing', idRestituicao }
  }

  private async wait (): Promise<void> {
    await new Promise<void>((resolve) => setTimeout(resolve, this.pollingIntervalMs))
  }

  private failure (description?: string): SolicitaRestituicaoVistoriaOutput {
    return {
      success: false,
      idRestituicao: null,
      showSnackbar: {
        variant: 'error',
        title: 'Não foi possível solicitar a restituição',
        description: description ?? 'Tente novamente em alguns instantes.'
      }
    }
  }
}
