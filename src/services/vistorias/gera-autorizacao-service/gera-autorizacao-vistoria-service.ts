import type { DetranSpServiceNowVistoriasClient } from '../../../clients/detran-sp-service-now-vistorias'
import type { GeraAutorizacaoVistoriaInput } from '../types'
import type { IAnalyticsService } from '../../analytics'

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
  constructor (
    private readonly client: DetranSpServiceNowVistoriasClient,
    private readonly analyticsService: IAnalyticsService
  ) {}

  async run (input: GeraAutorizacaoVistoriaInput): Promise<GeraAutorizacaoVistoriaOutput> {
    const { token, cpf, ...body } = input
    const result = await this.client.geraDocumento({ token, cpf }, body)
    const response = result?.result

    if (response?.success) {
      this.analyticsService.capture(cpf, 'vistorias:authorization_generate', {
        $insert_id: this.analyticsService.createInsertId(`vistorias:authorization_generate:${body.numeroPEV}`)
      })

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
