import type { DetranSpServiceNowVistoriasClient } from '../../../clients/detran-sp-service-now-vistorias'
import type { VistoriasAuth } from '../types'

export type BuscaDocumentoRestituicaoVistoriaOutput =
  | { pdf: string }
  | {
    pdf: null
    showSnackbar: {
      variant: 'error'
      title: string
      description: string
    }
  }

export class BuscaDocumentoRestituicaoVistoriaService {
  constructor (private readonly client: DetranSpServiceNowVistoriasClient) {}

  async run (auth: VistoriasAuth, numeroPEV: string): Promise<BuscaDocumentoRestituicaoVistoriaOutput> {
    const result = await this.client.buscaDocumentoRestituicao(auth, numeroPEV)
    const response = result?.result

    if (response?.success && response.data.anexo_vistoria) {
      return { pdf: response.data.anexo_vistoria }
    }

    return {
      pdf: null,
      showSnackbar: {
        variant: 'error',
        title: 'Não foi possível buscar o documento da restituição',
        description: response?.message ?? 'Tente novamente em alguns instantes.'
      }
    }
  }
}
