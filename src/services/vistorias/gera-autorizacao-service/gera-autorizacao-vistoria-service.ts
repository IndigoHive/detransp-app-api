import type { DetranSpServiceNowVistoriasClient } from '../../../clients/detran-sp-service-now-vistorias'
import type { GeraAutorizacaoVistoriaInput } from '../types'

type GeraAutorizacaoVistoriaOutput =
  | { pdf: string }
  | {
    pdf: null
    showSnackbar: {
      variant: 'error'
      title: string
      description: string
    }
  }

export class GeraAutorizacaoVistoriaService {
  constructor (private readonly client: DetranSpServiceNowVistoriasClient) {}

  async run (input: GeraAutorizacaoVistoriaInput): Promise<GeraAutorizacaoVistoriaOutput> {
    const result = await this.client.geraDocumento(input)
    const response = result?.result

    if (response?.success) {
      return { pdf: response.base64 }
    }

    return {
      pdf: null,
      showSnackbar: {
        variant: 'error',
        title: 'Não foi possível gerar a autorização',
        description: response?.message ?? 'Tente novamente em alguns instantes.'
      }
    }
  }
}
