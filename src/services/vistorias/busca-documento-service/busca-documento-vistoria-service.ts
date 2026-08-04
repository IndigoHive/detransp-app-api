import type { DetranSpServiceNowVistoriasClient } from '../../../clients/detran-sp-service-now-vistorias'
import type { VistoriasAuth } from '../types'

export type BuscaDocumentoVistoriaOutput =
  | { pdf: string }
  | {
    pdf: null
    showSnackbar: {
      variant: 'error'
      title: string
      description: string
    }
  }

export class BuscaDocumentoVistoriaService {
  constructor (private readonly client: DetranSpServiceNowVistoriasClient) {}

  async run (auth: VistoriasAuth, numeroPEV: string): Promise<BuscaDocumentoVistoriaOutput> {
    const result = await this.client.buscaDocumentoVistoria(auth, numeroPEV)
    const response = result?.result

    if (response?.success && response.data.anexo_vistoria) {
      return { pdf: response.data.anexo_vistoria }
    }

    return {
      pdf: null,
      showSnackbar: {
        variant: 'error',
        title: 'Não foi possível buscar o documento de vistoria',
        description: response?.message ?? 'Tente novamente em alguns instantes.'
      }
    }
  }
}
